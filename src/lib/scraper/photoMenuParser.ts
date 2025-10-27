import OpenAI from "openai";
import type { MenuItem, ParsedMenu } from "./menuParser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GooglePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions?: Array<{
    displayName: string;
    uri: string;
    photoUri: string;
  }>;
}

export async function parseMenuFromPhotos(
  photos: GooglePhoto[],
  apiKey: string,
  restaurantName: string
): Promise<ParsedMenu | null> {
  try {
    if (!photos || photos.length === 0) {
      console.log('[Photo Parser] No photos available');
      return null;
    }

    console.log('[Photo Parser] Processing', photos.length, 'photos');

    // Take first 5 photos (likely to include menu photos)
    const photoUrls = photos.slice(0, 5).map(photo => {
      // Construct photo URL using Google Places API
      const photoName = photo.name;
      return `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=1000&maxWidthPx=1000`;
    });

    console.log('[Photo Parser] Analyzing photos with GPT Vision...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a menu extraction assistant. Analyze restaurant photos and extract menu items. Only extract items from photos that show menus, menu boards, or price lists. Ignore photos of food, interiors, or exteriors."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Restaurant: ${restaurantName}\n\nAnalyze these photos and extract menu items if any photos show a menu. Return JSON in this format:\n{\n  "categories": ["Category 1", ...],\n  "items": [\n    {\n      "name": "Item name",\n      "description": "Description (optional)",\n      "price": "Price with currency (optional)",\n      "category": "Category (optional)"\n    }\n  ]\n}\n\nRules:\n- ONLY extract from photos that clearly show menus/price lists\n- If no menu photos, return empty items array\n- Do not make up items\n- Return valid JSON only`
            },
            ...photoUrls.map(url => ({
              type: "image_url" as const,
              image_url: {
                url,
                detail: "low" as const // Use low detail for faster processing
              }
            }))
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;

    if (!result) {
      console.error('[Photo Parser] No response from GPT');
      return null;
    }

    const parsedMenu: ParsedMenu = JSON.parse(result);

    console.log('[Photo Parser] Successfully parsed', parsedMenu.items?.length || 0, 'menu items from photos');

    return parsedMenu;
  } catch (error) {
    console.error('[Photo Parser] Error:', error);
    return null;
  }
}
