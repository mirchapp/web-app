import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { placeId, restaurantData, menuData } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Check if restaurant already exists
    const { data: existingRestaurant } = await supabase
      .from('Restaurant')
      .select('id')
      .eq('google_place_id', placeId)
      .single();

    if (existingRestaurant) {
      console.log('Restaurant already exists:', existingRestaurant.id);
      return NextResponse.json({
        success: true,
        restaurantId: existingRestaurant.id,
        message: 'Restaurant already exists',
      });
    }

    // 2. Create restaurant
    const slug = generateSlug(restaurantData.name);
    const restaurantInsert: Database['public']['Tables']['Restaurant']['Insert'] = {
      google_place_id: placeId,
      name: restaurantData.name,
      slug: slug,
      address: restaurantData.address || null,
      city: restaurantData.city || null,
      website_url: restaurantData.websiteUrl || null,
      currency: restaurantData.currency || 'USD',
      logo_url: restaurantData.logo || null,
      primary_colour: restaurantData.colors?.primary || null,
      secondary_colour: restaurantData.colors?.secondary || null,
      accent_colour: restaurantData.colors?.accent || null,
      latitude: restaurantData.latitude || null,
      longitude: restaurantData.longitude || null,
      phone: restaurantData.phone || null,
      rating: restaurantData.rating || null,
      verified: false,
    };

    const { data: restaurant, error: restaurantError } = await supabase
      .from('Restaurant')
      .insert(restaurantInsert)
      .select('id')
      .single();

    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError);
      return NextResponse.json(
        { error: 'Failed to create restaurant', details: restaurantError.message },
        { status: 500 }
      );
    }

    console.log('✅ Created restaurant:', restaurant.id);

    // 3. Create menu categories and items
    if (menuData?.categories && Array.isArray(menuData.categories)) {
      for (let i = 0; i < menuData.categories.length; i++) {
        const category = menuData.categories[i];

        // Insert category
        const categoryInsert: Database['public']['Tables']['Menu_Category']['Insert'] = {
          restaurant_id: restaurant.id,
          name: category.name || 'Uncategorized',
          display_order: i,
        };

        const { data: categoryData, error: categoryError } = await supabase
          .from('Menu_Category')
          .insert(categoryInsert)
          .select('id')
          .single();

        if (categoryError) {
          console.error('Error creating category:', categoryError);
          continue;
        }

        console.log(`✅ Created category: ${category.name}`);

        // Insert items for this category
        if (category.items && Array.isArray(category.items)) {
          const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = category.items.map((item: { name?: string; description?: string; price?: string }) => ({
            restaurant_id: restaurant.id,
            category_id: categoryData.id,
            name: item.name || 'Unknown Item',
            description: item.description || null,
            price: item.price || null,
          }));

          const { error: itemsError } = await supabase
            .from('Menu_Item')
            .insert(itemInserts);

          if (itemsError) {
            console.error('Error creating menu items:', itemsError);
          } else {
            console.log(`✅ Created ${itemInserts.length} items for category: ${category.name}`);
          }
        }
      }
    }

    // 4. Handle uncategorized items
    if (menuData?.items && Array.isArray(menuData.items)) {
      // Create an "Uncategorized" category
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
        const itemInserts: Database['public']['Tables']['Menu_Item']['Insert'][] = menuData.items.map((item: { name?: string; description?: string; price?: string }) => ({
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
          console.log(`✅ Created ${itemInserts.length} uncategorized items`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      restaurantId: restaurant.id,
      message: 'Restaurant and menu saved successfully',
    });
  } catch (error) {
    console.error('Error in save endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
