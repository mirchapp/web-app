import { NextRequest, NextResponse } from 'next/server';
import { scrapeGoogleMapsMenu } from '@/lib/scraper/googleMapsScraper';
import { scrapeRestaurantMenuWithPuppeteer } from '@/lib/scraper/puppeteerScraper';
import { parseMenuWithGPT } from '@/lib/scraper/menuParser';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json(
      { error: 'placeId parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Using Google Places API (New) - Place Details
    // https://developers.google.com/maps/documentation/places/web-service/place-details
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,websiteUri,addressComponents',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Places API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch place details from Google Places API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract city from addressComponents
    const cityComponent = data.addressComponents?.find(
      (component: { types: string[] }) =>
        component.types.includes('locality') || component.types.includes('administrative_area_level_3')
    );

    // Extract country for currency determination
    const countryComponent = data.addressComponents?.find(
      (component: { types: string[] }) => component.types.includes('country')
    );
    const countryCode = countryComponent?.shortText || 'US';
    const currency = countryCode === 'CA' ? 'CAD' : 'USD';

    const name = data.displayName?.text || 'Unknown Restaurant';
    const city = cityComponent?.longText || cityComponent?.shortText || null;
    const websiteUrl = data.websiteUri || null;

    console.log('✅ Restaurant details:', { name, city, websiteUrl });

    // Strategy: Scrape both sources in parallel with aggressive timeout
    console.log('🔍 Starting parallel scraping...');

    const websitePromise = websiteUrl
      ? scrapeRestaurantMenuWithPuppeteer(websiteUrl)
          .catch(err => {
            console.error('❌ Website scrape failed:', err.message);
            return null;
          })
      : Promise.resolve(null);

    const googleMapsPromise = scrapeGoogleMapsMenu(placeId)
      .catch(err => {
        console.error('❌ Google Maps scrape failed:', err.message);
        return null;
      });

    // Increased timeout to 120 seconds to allow full category navigation
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Scraping timeout')), 120000)
    );

    // Race with timeout
    const [websiteData, googleMapsData] = await Promise.race([
      Promise.all([websitePromise, googleMapsPromise]),
      timeoutPromise
    ]).catch(err => {
      console.error('❌ Scraping timed out or failed:', err.message);
      return [null, null];
    });

    const websiteContent = typeof websiteData === 'string' ? websiteData : websiteData?.text || '';
    const websiteLogo = typeof websiteData === 'object' ? websiteData?.logo : undefined;
    const websiteColors = typeof websiteData === 'object' ? websiteData?.colors : undefined;
    const googleMapsContent = googleMapsData?.text || '';
    const googleMapsLogo = googleMapsData?.logo;
    const googleMapsColors = googleMapsData?.colors;

    if (websiteContent) {
      console.log('✅ Successfully scraped restaurant website:', websiteContent.length, 'chars');
    }
    if (googleMapsContent) {
      console.log('✅ Successfully scraped Google Maps:', googleMapsContent.length, 'chars');
    }

    // 3. Parse with GPT, prioritizing website data
    let menu = null;
    let gptInput = '';
    if (websiteContent || googleMapsContent) {
      console.log('🤖 Parsing menu with GPT...');

      const combinedContent = `
${websiteContent ? `${websiteContent}\n\n` : ''}
${googleMapsContent ? `${googleMapsContent}` : ''}
      `.trim();

      const contentToSend = combinedContent || 'No text content available.';
      gptInput = contentToSend;

      menu = await parseMenuWithGPT(contentToSend, name, websiteContent.length > 0);
    }

    // Determine best logo and colors (prefer website, fallback to Google Maps)
    const logo = websiteLogo || googleMapsLogo || undefined;
    const colors = websiteColors || googleMapsColors || undefined;

    const payload = {
      restaurant: {
        name,
        websiteUrl,
        city,
        currency,
        logo,
        colors
      },
      menu: menu || { items: [] },
      debug: {
        websiteScraperOutput: websiteContent,
        googleMapsScraperOutput: googleMapsContent,
        websiteLogo,
        googleMapsLogo,
        websiteColors,
        googleMapsColors,
        gptInput: gptInput,
        inputLength: gptInput.length
      }
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
