import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { scrapeGoogleMapsMenu } from '@/lib/scraper/googleMapsScraper';
import { scrapeRestaurantMenuWithPuppeteer } from '@/lib/scraper/puppeteerScraper';
import { streamParseMenuWithGPT } from '@/lib/scraper/menuParserStream';
import type { MenuChunk } from '@/lib/scraper/menuParserStream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  const { placeId, restaurantName, address, latitude, longitude, phone, rating } = await request.json();

  if (!placeId || !restaurantName) {
    return new Response(
      JSON.stringify({ error: 'placeId and restaurantName are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = createAdminClient();

        // Step 1: Finding menu (scraping)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Finding menu...',
            step: 1,
            totalSteps: 2
          })}\n\n`)
        );

        const { data: existingRestaurant } = await supabase
          .from('Restaurant')
          .select('id, name, slug, logo_url, primary_colour, secondary_colour, accent_colour, Menu_Category(id, name, display_order, Menu_Item(id, name, description, price))')
          .eq('google_place_id', placeId)
          .single();

        if (existingRestaurant) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              message: 'Restaurant already exists',
              alreadyExists: true,
              restaurant: existingRestaurant
            })}\n\n`)
          );
          controller.close();
          return;
        }


        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not configured');
        }

        const response = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'id,displayName,formattedAddress,websiteUri,addressComponents,nationalPhoneNumber,internationalPhoneNumber',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch place details');
        }

        const data = await response.json();
        const cityComponent = data.addressComponents?.find(
          (component: { types: string[] }) =>
            component.types.includes('locality') || component.types.includes('administrative_area_level_3')
        );
        const countryComponent = data.addressComponents?.find(
          (component: { types: string[] }) => component.types.includes('country')
        );
        const countryCode = countryComponent?.shortText || 'US';
        const currency = countryCode === 'CA' ? 'CAD' : 'USD';
        const city = cityComponent?.longText || cityComponent?.shortText || null;
        const websiteUrl = data.websiteUri || null;

        // Get phone number from Google Places (prefer international format for tel: links)
        const phoneNumber = data.internationalPhoneNumber || data.nationalPhoneNumber || phone || null;


        const websitePromise = websiteUrl
          ? scrapeRestaurantMenuWithPuppeteer(websiteUrl).catch(() => null)
          : Promise.resolve(null);

        const googleMapsPromise = scrapeGoogleMapsMenu(placeId).catch(() => null);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Scraping timeout')), 120000)
        );

        const [websiteData, googleMapsData] = await Promise.race([
          Promise.all([websitePromise, googleMapsPromise]),
          timeoutPromise
        ]).catch(() => [null, null]);

        const websiteContent = typeof websiteData === 'string' ? websiteData : websiteData?.text || '';
        const websiteLogo = typeof websiteData === 'object' ? websiteData?.logo : undefined;
        const websiteColors = typeof websiteData === 'object' ? websiteData?.colors : undefined;
        const googleMapsContent = googleMapsData?.text || '';
        const googleMapsLogo = googleMapsData?.logo;
        const googleMapsColors = googleMapsData?.colors;

        const logo = websiteLogo || googleMapsLogo || undefined;
        const colors = websiteColors || googleMapsColors || undefined;

        // Send logo and colors immediately
        if (logo || colors) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'branding',
              data: { logo, colors }
            })}\n\n`)
          );
        }

        // Step 2: Crafting menu (AI parsing)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Crafting menu...',
            step: 2,
            totalSteps: 2
          })}\n\n`)
        );

        const combinedContent = `
${websiteContent ? `${websiteContent}\n\n` : ''}
${googleMapsContent ? `${googleMapsContent}` : ''}
        `.trim();

        // Collect all menu data for database saving
        let description = '';
        let _cuisine = '';
        let _tags: string[] = [];
        const categories: string[] = [];
        const items: Array<{
          name: string;
          description?: string | null;
          price?: string | null;
          category?: string | null;
          tags?: string[];
        }> = [];

        // Stream GPT results to client AND collect for DB
        await streamParseMenuWithGPT(
          combinedContent || 'No text content available.',
          restaurantName,
          websiteContent.length > 0,
          (chunk: MenuChunk) => {
            // Stream to client
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'menu_chunk',
                data: chunk
              })}\n\n`)
            );

            // Collect for database
            if (chunk.type === 'description' && chunk.data.description) {
              description = chunk.data.description;
            } else if (chunk.type === 'cuisine' && chunk.data.cuisine) {
              _cuisine = chunk.data.cuisine;
            } else if (chunk.type === 'tags' && chunk.data.tags) {
              _tags = chunk.data.tags;
            } else if (chunk.type === 'category' && chunk.data.categoryName) {
              categories.push(chunk.data.categoryName);
            } else if (chunk.type === 'item' && chunk.data.item) {
              items.push(chunk.data.item);
            }
          }
        );


        const slug = generateSlug(restaurantName);
        const restaurantInsert: Database['public']['Tables']['Restaurant']['Insert'] = {
          google_place_id: placeId,
          name: restaurantName,
          slug: slug,
          address: address || null,
          city: city,
          website_url: websiteUrl || null,
          currency: currency,
          logo_url: logo || null,
          description: description || null,
          primary_colour: colors?.primary || null,
          secondary_colour: colors?.secondary || null,
          accent_colour: colors?.accent || null,
          latitude: latitude || null,
          longitude: longitude || null,
          phone: phoneNumber,
          rating: rating || null,
          verified: false,
        };

        const { data: restaurant, error: restaurantError } = await supabase
          .from('Restaurant')
          .insert(restaurantInsert)
          .select('id, slug')
          .single();

        if (restaurantError || !restaurant) {
          throw new Error('Failed to create restaurant');
        }

        // Create categories and items
        const categoryIdMap = new Map<string, string>();

        for (let i = 0; i < categories.length; i++) {
          const categoryName = categories[i];
          const categoryInsert: Database['public']['Tables']['Menu_Category']['Insert'] = {
            restaurant_id: restaurant.id,
            name: categoryName,
            display_order: i,
          };

          const { data: categoryData, error: categoryError } = await supabase
            .from('Menu_Category')
            .insert(categoryInsert)
            .select('id')
            .single();

          if (!categoryError && categoryData) {
            categoryIdMap.set(categoryName, categoryData.id);
          }
        }

        // Insert items by category
        for (const [categoryName, categoryId] of categoryIdMap.entries()) {
          const categoryItems = items.filter(item => item.category === categoryName);

          if (categoryItems.length > 0) {
            const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = categoryItems.map(item => ({
              restaurant_id: restaurant.id,
              category_id: categoryId,
              name: item.name || 'Unknown Item',
              description: item.description || null,
              price: item.price || null,
            }));

            await supabase.from('Menu_Item').insert(itemInserts);
          }
        }

        // Handle uncategorized items
        const uncategorizedItems = items.filter(item => !item.category || !categoryIdMap.has(item.category));

        if (uncategorizedItems.length > 0) {
          const uncategorizedInsert: Database['public']['Tables']['Menu_Category']['Insert'] = {
            restaurant_id: restaurant.id,
            name: 'Menu',
            display_order: 999,
          };

          const { data: uncategorizedCategory } = await supabase
            .from('Menu_Category')
            .insert(uncategorizedInsert)
            .select('id')
            .single();

          if (uncategorizedCategory) {
            const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = uncategorizedItems.map(item => ({
              restaurant_id: restaurant.id,
              category_id: uncategorizedCategory.id,
              name: item.name || 'Unknown Item',
              description: item.description || null,
              price: item.price || null,
            }));

            await supabase.from('Menu_Item').insert(itemInserts);
          }
        }

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Restaurant saved successfully!',
            restaurantId: restaurant.id,
            restaurantSlug: restaurant.slug,
            totalCategories: categories.length,
            totalItems: items.length
          })}\n\n`)
        );

        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
