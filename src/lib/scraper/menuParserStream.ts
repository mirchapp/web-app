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

    const textPrompt = `You will be given raw menu content for a restaurant. Stream newline-delimited JSON (NDJSON) events that describe the restaurant and its menu as soon as information becomes available.

Restaurant: ${restaurantName}
Has website data: ${hasWebsiteData ? "yes" : "no"}

Text Content (preprocessed):
${preprocessed}

Output Specification:
- Every line you emit MUST be a single JSON object with the shape {"type": string, "data": object}. Do not wrap the output in an array or include any extra commentary.
- Valid event shapes (emit only these):
  {"type":"description","data":{"description":"..."}}
  {"type":"cuisine","data":{"cuisine":"..."}}
  {"type":"tags","data":{"tags":["vegetarian","halal",...]}}
  {"type":"category","data":{"categoryName":"..."}}
  {"type":"item","data":{"item":{"name":"...","description":null,"price":null,"category":null,"tags":[]}}}

Streaming Rules:
- Start streaming immediately. Emit each JSON object on its own line with a trailing newline. Never merge multiple objects onto one line.
- Emit the restaurant description early. Provide a polished, inviting 2-3 sentence description. Whenever you refine it, emit another description event containing the full latest text.
- Emit cuisine exactly once using this list: Italian, Japanese, Mexican, American, Indian, Chinese, French, Korean, Mediterranean, Thai, Vietnamese, Spanish, Pakistani, Persian, Greek, Turkish, Lebanese, Middle Eastern, Ethiopian, Moroccan, Brazilian, Caribbean, African, Fusion, International.
- Emit restaurant tags only if the content clearly supports them. Use only: vegetarian, vegan, gluten-free, nut-allergy, shellfish-allergy, lactose-free, halal, kosher.
- When you encounter a new menu section, emit a category event BEFORE emitting its items. Use title case for category names.
- Emit an item event only when you have the full details for that item (name required, description/price/category/tags optional but use null when missing). Use title case for item names, preserve currency symbols, and only include dietary tags when certain.
- Deduplicate menu items: treat items with the same name (case-insensitive) AND same price as duplicates—emit only the most descriptive version once.
- Keep abbreviations capitalized (e.g., BBQ), fix grammar, and respect brand capitalization.
- Do not hallucinate information. Base everything strictly on the provided content.
- End the stream after emitting all relevant events. Do not output any non-JSON text.`;

    const stream = await openai.responses.stream({
      model: "gpt-5",
      reasoning: { effort: "minimal" },
      instructions:
        "You are a professional menu extraction expert. Follow the NDJSON event spec exactly and stream structured updates with proper grammar and capitalization.",
      input: textPrompt,
      text: {
        verbosity: "low",
      },
    });

    let buffer = "";
    let lastDescription = "";
    let cuisineSent = false;
    let tagsSent = false;
    const seenCategories = new Set<string>();
    const seenItemKeys = new Set<string>();
    let sentCategoriesCount = 0;
    let sentItemsCount = 0;

    const emitChunk = (chunk: MenuChunk) => {
      if (!chunk || typeof chunk !== "object") {
        return;
      }

      switch (chunk.type) {
        case "description": {
          const description = chunk.data?.description?.trim();
          if (!description || description === lastDescription) {
            return;
          }
          lastDescription = description;
          onChunk({
            type: "description",
            data: { description },
          });
          break;
        }
        case "cuisine": {
          const cuisine = chunk.data?.cuisine?.trim();
          if (!cuisine || cuisineSent) {
            return;
          }
          cuisineSent = true;
          onChunk({
            type: "cuisine",
            data: { cuisine },
          });
          break;
        }
        case "tags": {
          if (tagsSent) {
            return;
          }
          const tags = Array.isArray(chunk.data?.tags)
            ? chunk.data.tags
                .map((tag: string) => tag?.trim())
                .filter((tag: string | undefined): tag is string => Boolean(tag))
            : [];
          if (tags.length === 0) {
            return;
          }
          tagsSent = true;
          onChunk({
            type: "tags",
            data: { tags },
          });
          break;
        }
        case "category": {
          const categoryName = chunk.data?.categoryName?.trim();
          if (!categoryName) {
            return;
          }
          const normalized = categoryName.replace(/\s+/g, " ").trim();
          const categoryKey = normalized.toLowerCase();
          if (seenCategories.has(categoryKey)) {
            return;
          }
          seenCategories.add(categoryKey);
          sentCategoriesCount += 1;
          onChunk({
            type: "category",
            data: { categoryName: normalized },
          });
          break;
        }
        case "item": {
          const item = chunk.data?.item;
          if (!item || typeof item !== "object") {
            return;
          }
          const name = String(item.name ?? "").trim();
          if (!name) {
            return;
          }
          const price = item.price != null ? String(item.price).trim() : null;
          const description = item.description != null ? String(item.description).trim() : null;
          const category = item.category != null ? String(item.category).trim() : null;
          const tags = Array.isArray(item.tags)
            ? item.tags
                .map((tag: string) => tag?.trim())
                .filter((tag: string | undefined): tag is string => Boolean(tag))
            : [];

          const itemKey = `${name.toLowerCase()}|${price ?? ""}`;
          if (seenItemKeys.has(itemKey)) {
            return;
          }
          seenItemKeys.add(itemKey);
          sentItemsCount += 1;

          onChunk({
            type: "item",
            data: {
              item: {
                name,
                description: description ?? null,
                price: price ?? null,
                category: category ?? null,
                tags,
              },
            },
          });
          break;
        }
        default:
          // Ignore unsupported event types gracefully
          break;
      }
    };

    const processLine = (line: string) => {
      if (!line) {
        return;
      }

      try {
        const parsed = JSON.parse(line) as MenuChunk;
        emitChunk(parsed);
      } catch (error) {
        console.warn("[Menu Parser] Skipping invalid JSON line:", line, error);
      }
    };

    const flushBuffer = (final = false) => {
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        processLine(line);
      }

      if (final) {
        const line = buffer.trim();
        buffer = "";
        if (line) {
          processLine(line);
        }
      }
    };

    stream.on("response.output_text.delta", (event) => {
      if (event.delta) {
        buffer += event.delta;
        flushBuffer();
      }
    });

    stream.on("response.refusal.delta", (event) => {
      console.error("[Menu Parser] Model refused:", event.delta);
    });

    try {
      await stream.finalResponse();
    } finally {
      flushBuffer(true);
    }

    console.log(`[Menu Parser] ✅ Streamed ${sentItemsCount} items across ${sentCategoriesCount} categories`);
  } catch (error) {
    console.error('[Menu Parser Stream] Error:', error);
    throw error;
  }
}
