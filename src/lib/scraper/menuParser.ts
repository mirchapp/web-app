import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  category?: string;
  tags?: string[];
}

export interface ParsedMenu {
  items: MenuItem[];
  categories?: string[];
  description?: string;
  cuisine?: string;
  tags?: string[];
}

export function preprocessMenuContent(content: string): string {
  // Remove common noise patterns to reduce content size while preserving menu data
  const cleaned = content
    // Remove common non-menu sections (but preserve structure)
    .replace(/privacy policy[^\n]*/gi, '')
    .replace(/terms of service[^\n]*/gi, '')
    .replace(/terms & conditions[^\n]*/gi, '')
    .replace(/cookie policy[^\n]*/gi, '')
    .replace(/all rights reserved[^\n]*/gi, '')
    // Remove URLs but keep the context
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove excessive spaces (but keep single newlines for structure)
    .replace(/[ \t]+/g, ' ')
    // Remove repeated decorative characters
    .replace(/([=\-_*])\1{4,}/g, '')
    // Collapse multiple newlines into single newlines
    .replace(/\n\s*\n+/g, '\n')
    // Remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();

  return cleaned;
}

export async function parseMenuWithGPT(content: string, restaurantName: string, hasWebsiteData?: boolean): Promise<ParsedMenu | null> {
  try {
    console.log('[Menu Parser] Parsing menu with GPT...');
    console.log('[Menu Parser] Text content length:', content.length);
    console.log('[Menu Parser] Has website data:', hasWebsiteData);

    // Preprocess to reduce size while keeping menu content
    const preprocessed = preprocessMenuContent(content);
    console.log('[Menu Parser] Preprocessed content length:', preprocessed.length);

    // Use preprocessed content
    const finalContent = preprocessed;

    console.log('[Menu Parser] Final content length:', finalContent.length);

    const textPrompt = `Extract menu items and restaurant information from the following content. Be concise.

Restaurant: ${restaurantName}

Text Content:
${finalContent}

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

Rules for Restaurant Description:
- Write a concise, appealing 2-3 sentence description of the restaurant
- Include cuisine type, specialties, and what makes it unique
- Base it ONLY on information found in the content (e.g., "about us", "our story", website text)
- If no restaurant information is found, create a brief description based on the menu items and restaurant name
- Make it sound professional and inviting
- Example: "Chiang Mai Thai Restaurant offers authentic Northern Thai cuisine in the heart of the city. Specializing in traditional curries and noodle dishes, they bring the flavors of Thailand to your table with fresh ingredients and family recipes."

Rules for Cuisine Type:
- Identify the PRIMARY cuisine type from this list: Italian, Japanese, Mexican, American, Indian, Chinese, French, Korean, Mediterranean, Thai, Vietnamese, Spanish, Pakistani, Persian, Greek, Turkish, Lebanese, Middle Eastern, Ethiopian, Moroccan, Brazilian, Caribbean, African, Fusion, International
- Return ONLY ONE cuisine type that best matches the restaurant
- If multiple cuisines apply, choose the most prominent one
- If unclear, infer from the menu items
- Be specific when possible (e.g., "Pakistani" instead of "Indian" if the menu clearly shows Pakistani dishes)

Rules for Restaurant Tags:
- Tag the restaurant with relevant dietary/religious tags from this list ONLY: vegetarian, vegan, gluten-free, nut-allergy, shellfish-allergy, lactose-free, halal, kosher
- ONLY include tags if the restaurant clearly accommodates that dietary restriction (e.g., has dedicated vegetarian/vegan options, is certified halal/kosher, etc.)
- Do NOT include a tag unless there's clear evidence in the menu or description
- Multiple tags can be included if applicable
- If none apply or unclear, return empty array

Rules for Menu Item Tags:
- Tag individual menu items with relevant dietary/religious tags from the same list
- Only tag items that clearly match the restriction (e.g., tag "Veggie Burger" as vegetarian and possibly vegan)
- Be conservative - only add tags when certain
- Multiple tags can be applied to a single item if applicable

IMPORTANT FORMATTING RULES:
- Capitalize all item names properly using title case (e.g., "Chicken Caesar Salad" not "chicken caesar salad" or "CHICKEN CAESAR SALAD")
- Capitalize all category names using title case (e.g., "Main Courses" not "main courses" or "MAIN COURSES")
- Fix any grammar errors in descriptions
- Ensure proper sentence structure and punctuation in descriptions
- Keep abbreviations in proper case (e.g., "BBQ" not "bbq", "USA" not "usa")
- Preserve brand names in their proper capitalization (e.g., "Coca-Cola" not "coca-cola")
- Restaurant description should be professional, grammatically correct, and engaging`;

    const response = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "minimal" },
      instructions: "You are a professional menu extraction expert with excellent attention to detail. Extract all menu items with their names, descriptions, prices, and categories. Also write a compelling restaurant description. Ensure all text is properly capitalized using title case, fix any grammar errors, and maintain professional formatting. Item names and categories must be in title case. Descriptions must be grammatically correct with proper punctuation. The restaurant description should be inviting and professional.",
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
              description: {
                type: "string",
                description: "A concise, professional 2-3 sentence description of the restaurant including cuisine type and specialties"
              },
              cuisine: {
                type: "string",
                description: "Primary cuisine type: Italian, Japanese, Mexican, American, Indian, Chinese, French, Korean, Mediterranean, Thai, Vietnamese, Spanish, Pakistani, Persian, Greek, Turkish, Lebanese, Middle Eastern, Ethiopian, Moroccan, Brazilian, Caribbean, African, Fusion, or International"
              },
              tags: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["vegetarian", "vegan", "gluten-free", "nut-allergy", "shellfish-allergy", "lactose-free", "halal", "kosher"]
                },
                description: "Restaurant-level dietary/religious accommodation tags"
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
      }
    });

    console.log('[Menu Parser] Response status:', response.status);
    console.log('[Menu Parser] Response output length:', response.output?.length);

    const outputText = response.output_text;

    if (!outputText) {
      console.error('[Menu Parser] No response from GPT');
      console.error('[Menu Parser] Full response:', JSON.stringify(response, null, 2));
      return null;
    }

    console.log('[Menu Parser] Output text length:', outputText.length);

    let parsedMenu: ParsedMenu;
    try {
      parsedMenu = JSON.parse(outputText);
    } catch (parseError) {
      console.error('[Menu Parser] Failed to parse JSON:', parseError);
      return null;
    }

    console.log('[Menu Parser] Successfully parsed', parsedMenu.items?.length || 0, 'menu items');

    return parsedMenu;
  } catch (error) {
    console.error('[Menu Parser] Error:', error);
    return null;
  }
}
