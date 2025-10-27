import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Track ongoing scrape jobs to prevent duplicates
const ongoingScrapeJobs = new Map<string, { startTime: number; promise: Promise<unknown> }>();

// Clean up stale jobs after 5 minutes
const SCRAPE_TIMEOUT = 5 * 60 * 1000;

// Create admin client with service role key to bypass RLS
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

// Clean up stale scrape jobs
function cleanupStaleJobs() {
  const now = Date.now();
  for (const [placeId, job] of ongoingScrapeJobs.entries()) {
    if (now - job.startTime > SCRAPE_TIMEOUT) {
      console.log(`🧹 [CLEANUP] Removing stale scrape job for ${placeId}`);
      ongoingScrapeJobs.delete(placeId);
    }
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [START] Restaurant scrape-and-save endpoint');

    const body = await request.json();
    const { placeId, address, latitude, longitude, phone, rating } = body;
    console.log('📥 [INPUT] Place ID:', placeId);
    console.log('📥 [INPUT] Address:', address);
    console.log('📥 [INPUT] Phone:', phone);
    console.log('📥 [INPUT] Rating:', rating);

    if (!placeId) {
      console.log('❌ [ERROR] Missing placeId');
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    // Clean up stale jobs first
    cleanupStaleJobs();

    // Check if there's an ongoing scrape job for this place
    const existingJob = ongoingScrapeJobs.get(placeId);
    if (existingJob) {
      const elapsed = Date.now() - existingJob.startTime;
      console.log(`⏳ [WAIT] Scrape job already in progress for ${placeId} (${elapsed}ms elapsed)`);
      console.log('⏳ [WAIT] Waiting for existing job to complete...');

      try {
        // Wait for the existing job to complete
        await existingJob.promise;
        console.log('✅ [WAIT] Existing job completed, returning success');
      } catch (error) {
        console.log('⚠️  [WAIT] Existing job failed, will retry');
        ongoingScrapeJobs.delete(placeId);
      }

      // Return in-progress status
      return NextResponse.json({
        success: true,
        message: 'Scrape job in progress',
        inProgress: true,
      });
    }

    console.log('🔧 [STEP 1/5] Creating admin Supabase client...');
    const supabase = createAdminClient();
    console.log('✅ [STEP 1/5] Admin client created');

    // 1. Check if restaurant already exists
    console.log('🔍 [STEP 2/5] Checking if restaurant already exists...');
    const { data: existingRestaurant } = await supabase
      .from('Restaurant')
      .select('id, name, slug')
      .eq('google_place_id', placeId)
      .single();

    if (existingRestaurant) {
      const duration = Date.now() - startTime;
      console.log('⏭️  [SKIP] Restaurant already exists in database');
      console.log('📊 [INFO] Restaurant ID:', existingRestaurant.id);
      console.log('📊 [INFO] Restaurant Name:', existingRestaurant.name);
      console.log('📊 [INFO] Restaurant Slug:', existingRestaurant.slug);
      console.log(`⏱️  [DONE] Completed in ${duration}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return NextResponse.json({
        success: true,
        restaurantId: existingRestaurant.id,
        restaurantSlug: existingRestaurant.slug,
        message: 'Restaurant already exists',
        alreadyExists: true,
      });
    }
    console.log('✅ [STEP 2/5] Restaurant does not exist, proceeding with scrape');

    // Create a promise for this scrape job and store it
    const scrapePromise = (async () => {
      try {
        return await performScrape(placeId, address, latitude, longitude, phone, rating, supabase, startTime);
      } finally {
        // Clean up the job from the map when done
        ongoingScrapeJobs.delete(placeId);
      }
    })();

    // Store the job
    ongoingScrapeJobs.set(placeId, {
      startTime,
      promise: scrapePromise,
    });

    console.log(`📌 [TRACK] Registered scrape job for ${placeId}`);

    // Wait for the scrape to complete and return the result
    return await scrapePromise;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ [FATAL ERROR] Scrape-and-save endpoint failed');
    console.error('❌ [ERROR] Details:', error);
    console.log(`⏱️  [ERROR] Failed after ${duration}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Extract the actual scrape logic into a separate function
async function performScrape(
  placeId: string,
  address: string | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  phone: string | undefined,
  rating: number | undefined,
  supabase: ReturnType<typeof createAdminClient>,
  startTime: number
) {
    // 2. Call the scraper endpoint
    console.log('🕷️  [STEP 3/5] Starting menu scraper...');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('🌐 [INFO] Scraper URL:', `${baseUrl}/api/menu?placeId=${placeId}`);

    const scrapeStartTime = Date.now();
    const scraperResponse = await fetch(`${baseUrl}/api/menu?placeId=${placeId}`);

    if (!scraperResponse.ok) {
      console.log('❌ [ERROR] Scraper request failed with status:', scraperResponse.status);
      throw new Error('Failed to scrape restaurant menu');
    }

    const scraperData = await scraperResponse.json();
    const scrapeDuration = Date.now() - scrapeStartTime;
    console.log(`✅ [STEP 3/5] Menu scraping completed in ${scrapeDuration}ms`);
    console.log('📊 [INFO] Restaurant name:', scraperData.restaurant.name);
    console.log('📊 [INFO] Website URL:', scraperData.restaurant.websiteUrl || 'N/A');
    console.log('📊 [INFO] Logo extracted:', scraperData.restaurant.logo ? 'Yes' : 'No');
    console.log('📊 [INFO] Colors extracted:', scraperData.restaurant.colors ? 'Yes' : 'No');
    console.log('📊 [INFO] Menu categories found:', scraperData.menu?.categories?.length || 0);
    console.log('📊 [INFO] Uncategorized items found:', scraperData.menu?.items?.length || 0);

    // Debug: Log the actual menu structure
    if (scraperData.menu?.categories?.length > 0) {
      console.log('🔍 [DEBUG] Full menu.categories from scraper:');
      console.log(JSON.stringify(scraperData.menu.categories, null, 2));
      console.log('🔍 [DEBUG] Category structure summary:');
      scraperData.menu.categories.forEach((cat: { name?: string; items?: unknown[] }, idx: number) => {
        console.log(`  Category ${idx + 1}: name="${cat.name}", items=${cat.items?.length || 0}`);
      });
    }

    // Debug: Log colors if available
    if (scraperData.restaurant.colors) {
      console.log('🎨 [DEBUG] Colors extracted:');
      console.log(`  Primary: ${scraperData.restaurant.colors.primary || 'N/A'}`);
      console.log(`  Secondary: ${scraperData.restaurant.colors.secondary || 'N/A'}`);
      console.log(`  Accent: ${scraperData.restaurant.colors.accent || 'N/A'}`);
      console.log(`  Text: ${scraperData.restaurant.colors.text || 'N/A'}`);
      console.log(`  Background: ${scraperData.restaurant.colors.background || 'N/A'}`);
    }

    // Debug: Log description if available
    if (scraperData.menu?.description) {
      console.log('📝 [DEBUG] Restaurant description:', scraperData.menu.description.substring(0, 100) + '...');
    }

    // 3. Create restaurant
    console.log('💾 [STEP 4/5] Creating restaurant record in database...');
    const slug = generateSlug(scraperData.restaurant.name);
    console.log('📊 [INFO] Generated slug:', slug);

    // Log what we're about to save
    console.log('📊 [INFO] Restaurant data to save:');
    console.log(`  - Name: ${scraperData.restaurant.name}`);
    console.log(`  - Slug: ${slug}`);
    console.log(`  - Address: ${address || 'N/A'}`);
    console.log(`  - City: ${scraperData.restaurant.city || 'N/A'}`);
    console.log(`  - Website: ${scraperData.restaurant.websiteUrl || 'N/A'}`);
    console.log(`  - Currency: ${scraperData.restaurant.currency || 'USD'}`);
    console.log(`  - Logo: ${scraperData.restaurant.logo ? 'Yes' : 'No'}`);
    console.log(`  - Description: ${scraperData.menu?.description ? 'Yes' : 'No'}`);
    console.log(`  - Primary Color: ${scraperData.restaurant.colors?.primary || 'N/A'}`);
    console.log(`  - Secondary Color: ${scraperData.restaurant.colors?.secondary || 'N/A'}`);
    console.log(`  - Accent Color: ${scraperData.restaurant.colors?.accent || 'N/A'}`);
    console.log(`  - Phone: ${phone || 'N/A'}`);
    console.log(`  - Rating: ${rating || 'N/A'}`);

    const restaurantInsert: Database['public']['Tables']['Restaurant']['Insert'] = {
      google_place_id: placeId,
      name: scraperData.restaurant.name,
      slug: slug,
      address: address || null,
      city: scraperData.restaurant.city || null,
      website_url: scraperData.restaurant.websiteUrl || null,
      currency: scraperData.restaurant.currency || 'USD',
      logo_url: scraperData.restaurant.logo || null,
      description: scraperData.menu?.description || null,
      primary_colour: scraperData.restaurant.colors?.primary || null,
      secondary_colour: scraperData.restaurant.colors?.secondary || null,
      accent_colour: scraperData.restaurant.colors?.accent || null,
      latitude: latitude || null,
      longitude: longitude || null,
      phone: phone || null,
      rating: rating || null,
      verified: false,
    };

    const { data: restaurant, error: restaurantError } = await supabase
      .from('Restaurant')
      .insert(restaurantInsert)
      .select('id, slug')
      .single();

    if (restaurantError) {
      console.log('❌ [ERROR] Failed to create restaurant record');
      console.error('❌ [ERROR] Details:', restaurantError);
      return NextResponse.json(
        { error: 'Failed to create restaurant', details: restaurantError.message },
        { status: 500 }
      );
    }

    console.log('✅ [STEP 4/5] Restaurant record created successfully');
    console.log('📊 [INFO] Restaurant DB ID:', restaurant.id);
    console.log('📊 [INFO] Restaurant Slug:', restaurant.slug);

    // 4. Create menu categories and items
    console.log('📋 [STEP 5/5] Creating menu categories and items...');
    let totalItems = 0;
    let totalCategories = 0;

    // The scraper returns categories as an array of strings and items with a category property
    if (scraperData.menu?.categories && Array.isArray(scraperData.menu.categories) &&
        scraperData.menu?.items && Array.isArray(scraperData.menu.items)) {

      const categoryNames = scraperData.menu.categories.filter((name: string) => name && name !== 'undefined');
      console.log(`📊 [INFO] Processing ${categoryNames.length} categories...`);

      // Create a map to store category IDs
      const categoryIdMap = new Map<string, string>();

      // Create each category
      for (let i = 0; i < categoryNames.length; i++) {
        const categoryName = categoryNames[i];
        console.log(`  ├─ [${i + 1}/${categoryNames.length}] Creating category: "${categoryName}"...`);

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

        if (categoryError) {
          console.log(`  ├─ ❌ Failed to create category: ${categoryName}`);
          console.error('  │  Error details:', categoryError);
          continue;
        }

        totalCategories++;
        categoryIdMap.set(categoryName, categoryData.id);
        console.log(`  ├─ ✅ Category created: "${categoryName}" (ID: ${categoryData.id})`);
      }

      // Now insert items, matching them to their categories
      console.log(`📊 [INFO] Inserting ${scraperData.menu.items.length} menu items...`);

      for (const [categoryName, categoryId] of categoryIdMap.entries()) {
        // Find all items for this category
        const categoryItems = scraperData.menu.items.filter((item: { category?: string }) => item.category === categoryName);

        if (categoryItems.length === 0) {
          console.log(`  │  ⚠️  No items found for category: ${categoryName}`);
          continue;
        }

        console.log(`  │  ├─ Creating ${categoryItems.length} items for "${categoryName}"...`);

        const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = categoryItems.map((item: { name?: string; description?: string; price?: string }) => ({
          restaurant_id: restaurant.id,
          category_id: categoryId,
          name: item.name || 'Unknown Item',
          description: item.description || null,
          price: item.price || null,
        }));

        const { error: itemsError } = await supabase
          .from('Menu_Item')
          .insert(itemInserts);

        if (itemsError) {
          console.log(`  │  ├─ ❌ Failed to create items for category: ${categoryName}`);
          console.error('  │  │  Error details:', itemsError);
        } else {
          totalItems += itemInserts.length;
          console.log(`  │  └─ ✅ Created ${itemInserts.length} items for "${categoryName}"`);
        }
      }

      // Handle items without a category or with invalid category
      const uncategorizedItems = scraperData.menu.items.filter((item: { category?: string }) =>
        !item.category || !categoryIdMap.has(item.category)
      );

      if (uncategorizedItems.length > 0) {
        console.log(`📊 [INFO] Found ${uncategorizedItems.length} items without valid categories`);
        console.log('  ├─ Creating "Menu" category for uncategorized items...');

        const uncategorizedInsert: Database['public']['Tables']['Menu_Category']['Insert'] = {
          restaurant_id: restaurant.id,
          name: 'Menu',
          display_order: 999,
        };

        const { data: uncategorizedCategory, error: uncategorizedError } = await supabase
          .from('Menu_Category')
          .insert(uncategorizedInsert)
          .select('id')
          .single();

        if (!uncategorizedError && uncategorizedCategory) {
          totalCategories++;
          console.log(`  ├─ ✅ "Menu" category created (ID: ${uncategorizedCategory.id})`);
          console.log(`  │  ├─ Creating ${uncategorizedItems.length} uncategorized items...`);

          const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = uncategorizedItems.map((item: { name?: string; description?: string; price?: string }) => ({
            restaurant_id: restaurant.id,
            category_id: uncategorizedCategory.id,
            name: item.name || 'Unknown Item',
            description: item.description || null,
            price: item.price || null,
          }));

          const { error: itemsError } = await supabase
            .from('Menu_Item')
            .insert(itemInserts);

          if (!itemsError) {
            totalItems += itemInserts.length;
            console.log(`  │  └─ ✅ Created ${itemInserts.length} uncategorized items`);
          } else {
            console.log(`  │  └─ ❌ Failed to create uncategorized items`);
            console.error('  │     Error details:', itemsError);
          }
        }
      }
    } else {
      console.log('📊 [INFO] No categorized menu found, trying to create from flat items list...');

      // Fallback: If no categories array, create a single "Menu" category with all items
      if (scraperData.menu?.items && Array.isArray(scraperData.menu.items) && scraperData.menu.items.length > 0) {
        console.log(`📊 [INFO] Creating single "Menu" category for ${scraperData.menu.items.length} items...`);

        const menuCategoryInsert: Database['public']['Tables']['Menu_Category']['Insert'] = {
          restaurant_id: restaurant.id,
          name: 'Menu',
          display_order: 0,
        };

        const { data: menuCategory, error: menuCategoryError } = await supabase
          .from('Menu_Category')
          .insert(menuCategoryInsert)
          .select('id')
          .single();

        if (!menuCategoryError && menuCategory) {
          totalCategories++;

          const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = scraperData.menu.items.map((item: { name?: string; description?: string; price?: string }) => ({
            restaurant_id: restaurant.id,
            category_id: menuCategory.id,
            name: item.name || 'Unknown Item',
            description: item.description || null,
            price: item.price || null,
          }));

          const { error: itemsError } = await supabase
            .from('Menu_Item')
            .insert(itemInserts);

          if (!itemsError) {
            totalItems += itemInserts.length;
            console.log(`✅ Created ${itemInserts.length} items in "Menu" category`);
          } else {
            console.log('❌ Failed to create menu items');
            console.error('Error details:', itemsError);
          }
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log('✅ [STEP 5/5] Menu creation completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 [SUMMARY] Restaurant saved successfully');
    console.log('📊 [SUMMARY] Restaurant ID:', restaurant.id);
    console.log('📊 [SUMMARY] Restaurant Name:', scraperData.restaurant.name);
    console.log('📊 [SUMMARY] Restaurant Slug:', restaurant.slug);
    console.log('📊 [SUMMARY] Total Categories:', totalCategories);
    console.log('📊 [SUMMARY] Total Items:', totalItems);
    console.log('📊 [SUMMARY] Data Saved:');
    console.log(`  ✅ Logo: ${scraperData.restaurant.logo ? 'Yes' : 'No'}`);
    console.log(`  ✅ Description: ${scraperData.menu?.description ? 'Yes' : 'No'}`);
    console.log(`  ✅ Primary Color: ${scraperData.restaurant.colors?.primary ? 'Yes' : 'No'}`);
    console.log(`  ✅ Secondary Color: ${scraperData.restaurant.colors?.secondary ? 'Yes' : 'No'}`);
    console.log(`  ✅ Accent Color: ${scraperData.restaurant.colors?.accent ? 'Yes' : 'No'}`);
    console.log(`  ✅ Website: ${scraperData.restaurant.websiteUrl ? 'Yes' : 'No'}`);
    console.log(`  ✅ City: ${scraperData.restaurant.city ? 'Yes' : 'No'}`);
    console.log(`⏱️  [SUMMARY] Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      totalCategories,
      totalItems,
      message: 'Restaurant and menu saved successfully',
      alreadyExists: false,
    });
}
