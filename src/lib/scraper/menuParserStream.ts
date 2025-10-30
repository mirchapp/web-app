import OpenAI from "openai";
import { preprocessMenuContent } from "./menuParser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MenuChunk {
  type: 'description' | 'cuisine' | 'tags' | 'category' | 'item';
  data: {
    description?: string;
    cuisine?: string;
    tags?: string[];
    categoryName?: string;
    item?: {
      name: string;
      description?: string | null;
      price?: string | null;
      category?: string | null;
      tags?: string[];
    };
  };
}

export async function streamParseMenuWithGPT(
  content: string,
  restaurantName: string,
  hasWebsiteData: boolean,
  onChunk: (chunk: MenuChunk) => void
): Promise<void> {
  try {
    const preprocessed = preprocessMenuContent(content);
    console.log(`[Menu Parser] Starting parse (${preprocessed.length} chars)...`);

    const textPrompt = `Extract menu items and restaurant information from the following content. Be concise.

Restaurant: ${restaurantName}

Text Content:
${preprocessed}

Rules for Menu Items:
- Extract only food and drink items with their full details
- For each item, include the name, description (if any text describes the item), and price
- Descriptions may appear on the same line or nearby lines - capture any descriptive text about each menu item
- Include prices if available (keep currency symbols like $)
- Group items by category if possible
- If a field is not available, use null (not empty string)
- If no clear menu is found, return an empty items array
- Do not make up items - only extract what you see in the text
- Keep the category structure the same as it appears on the restaurant's website

CRITICAL - DEDUPLICATION RULES:
- Remove duplicate menu items - items are duplicates if they have very similar names and the same price
- When deduplicating, keep the version with the more descriptive/complete name
- Examples of duplicates to remove:
  * "Tikka Garlic Mayo Roll" and "Chicken Tikka Garlic Mayo Roll" with same price → Keep "Chicken Tikka Garlic Mayo Roll"
  * "Caesar Salad" and "Caesar Salad" with same price → Keep only one
  * "Cheeseburger" and "Burger with Cheese" with same price → Keep the first one encountered
- Items with different prices are NOT duplicates even if names are similar
- Items with significantly different names are NOT duplicates even if same price

Rules for Restaurant Description:
- Write a concise, appealing 2-3 sentence description of the restaurant
- Include cuisine type, specialties, and what makes it unique
- Base it ONLY on information found in the content (e.g., "about us", "our story", website text)
- If no restaurant information is found, create a brief description based on the menu items and restaurant name
- Make it sound professional and inviting

Rules for Cuisine Type:
- Identify the PRIMARY cuisine type from this list: Italian, Japanese, Mexican, American, Indian, Chinese, French, Korean, Mediterranean, Thai, Vietnamese, Spanish, Pakistani, Persian, Greek, Turkish, Lebanese, Middle Eastern, Ethiopian, Moroccan, Brazilian, Caribbean, African, Fusion, International
- Return ONLY ONE cuisine type that best matches the restaurant
- If multiple cuisines apply, choose the most prominent one
- If unclear, infer from the menu items
- Be specific when possible (e.g., "Pakistani" instead of "Indian" if the menu clearly shows Pakistani dishes)

Rules for Restaurant Tags:
- Tag the restaurant with relevant dietary/religious tags from this list ONLY: vegetarian, vegan, gluten-free, nut-allergy, shellfish-allergy, lactose-free, halal, kosher
- ONLY include tags if the restaurant clearly accommodates that dietary restriction
- Do NOT include a tag unless there's clear evidence in the menu or description
- Multiple tags can be included if applicable
- If none apply or unclear, return empty array

Rules for Menu Item Tags:
- Tag individual menu items with relevant dietary/religious tags from the same list
- Only tag items that clearly match the restriction
- Be conservative - only add tags when certain
- Multiple tags can be applied to a single item if applicable

IMPORTANT FORMATTING RULES:
- Capitalize all item names properly using title case (e.g., "Chicken Caesar Salad")
- Capitalize all category names using title case (e.g., "Main Courses")
- Fix any grammar errors in descriptions
- Ensure proper sentence structure and punctuation in descriptions
- Keep abbreviations in proper case (e.g., "BBQ" not "bbq")
- Preserve brand names in their proper capitalization`;

    const response = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "minimal" },
      instructions: "You are a professional menu extraction expert. Extract menu items and write compelling descriptions. Ensure proper capitalization and grammar.",
      input: textPrompt,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "menu_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              cuisine: { type: "string" },
              tags: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["vegetarian", "vegan", "gluten-free", "nut-allergy", "shellfish-allergy", "lactose-free", "halal", "kosher"]
                }
              },
              categories: {
                type: "array",
                items: { type: "string" }
              },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    price: { type: ["string", "null"] },
                    category: { type: ["string", "null"] },
                    tags: {
                      type: "array",
                      items: {
                        type: "string",
                        enum: ["vegetarian", "vegan", "gluten-free", "nut-allergy", "shellfish-allergy", "lactose-free", "halal", "kosher"]
                      }
                    }
                  },
                  required: ["name", "description", "price", "category", "tags"],
                  additionalProperties: false
                }
              }
            },
            required: ["description", "cuisine", "tags", "items", "categories"],
            additionalProperties: false
          }
        }
      },
      stream: true
    });

    // Track what we've already sent to avoid duplicates
    let sentDescription = false;
    let sentCuisine = false;
    let sentTags = false;
    let sentCategoriesCount = 0;
    let sentItemsCount = 0;

    // Buffer for accumulating the text delta
    let accumulatedText = '';

    for await (const event of response) {
      // Handle text deltas - accumulate them
      if (event.type === 'response.output_text.delta' && event.delta) {
        accumulatedText += event.delta;

        // Try to parse the accumulated JSON incrementally
        try {
          const parsed = JSON.parse(accumulatedText);

          // Send description if new and not sent
          if (parsed.description && !sentDescription) {
            sentDescription = true;
            onChunk({
              type: 'description',
              data: { description: parsed.description }
            });
          }

          // Send cuisine if new and not sent
          if (parsed.cuisine && !sentCuisine) {
            sentCuisine = true;
            onChunk({
              type: 'cuisine',
              data: { cuisine: parsed.cuisine }
            });
          }

          // Send tags if new and not sent
          if (parsed.tags && !sentTags && Array.isArray(parsed.tags) && parsed.tags.length > 0) {
            sentTags = true;
            onChunk({
              type: 'tags',
              data: { tags: parsed.tags }
            });
          }

          // Send new categories as they appear
          if (parsed.categories && Array.isArray(parsed.categories)) {
            const newCategories = parsed.categories.slice(sentCategoriesCount);
            for (const category of newCategories) {
              onChunk({
                type: 'category',
                data: { categoryName: category }
              });
            }
            sentCategoriesCount = parsed.categories.length;
          }

          // Send new items as they appear
          if (parsed.items && Array.isArray(parsed.items)) {
            const newItems = parsed.items.slice(sentItemsCount);
            for (const item of newItems) {
              onChunk({
                type: 'item',
                data: { item }
              });
            }
            sentItemsCount = parsed.items.length;
          }
        } catch (_e) {
          // Incomplete JSON, continue buffering - this is expected during streaming
        }
      }

      // Handle refusals
      if (event.type === 'response.refusal.delta') {
        console.error('[Menu Parser] Model refused:', event.delta);
      }
    }

    console.log(`[Menu Parser] ✅ Streamed ${sentItemsCount} items across ${sentCategoriesCount} categories`);
  } catch (error) {
    console.error('[Menu Parser Stream] Error:', error);
    throw error;
  }
}
