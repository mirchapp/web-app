import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeId = searchParams.get('placeId');
    const slug = searchParams.get('slug');

    if (!placeId && !slug) {
      return NextResponse.json(
        { error: 'placeId or slug is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Query by placeId or slug
    let query = supabase
      .from('Restaurant')
      .select(`
        *,
        Menu_Category (
          id,
          name,
          display_order,
          Menu_Item (
            id,
            name,
            description,
            price
          )
        )
      `);

    if (placeId) {
      query = query.eq('google_place_id', placeId);
    } else if (slug) {
      query = query.eq('slug', slug);
    }

    const { data: restaurant, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { exists: false, restaurant: null },
          { status: 200 }
        );
      }
      console.error('Error fetching restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurant' },
        { status: 500 }
      );
    }

    // Sort categories by display_order
    if (restaurant.Menu_Category) {
      restaurant.Menu_Category.sort((a: { display_order?: number | null }, b: { display_order?: number | null }) =>
        (a.display_order || 0) - (b.display_order || 0)
      );
    }

    return NextResponse.json({
      exists: true,
      restaurant: restaurant,
    });
  } catch (error) {
    console.error('Error in restaurant get endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
