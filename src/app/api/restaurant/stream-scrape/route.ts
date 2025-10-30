import { NextRequest } from 'next/server';
import { scrapeGoogleMapsMenu } from '@/lib/scraper/googleMapsScraper';
import { scrapeRestaurantMenuWithPuppeteer } from '@/lib/scraper/puppeteerScraper';
import { streamParseMenuWithGPT } from '@/lib/scraper/menuParserStream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { placeId, restaurantName, address: _address, latitude: _latitude, longitude: _longitude, phone: _phone, rating: _rating } = await request.json();

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
        // Send initial status
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Fetching restaurant details...',
            step: 1,
            totalSteps: 5
          })}\n\n`)
        );

        // Get basic restaurant info from Google Places API
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
              'X-Goog-FieldMask': 'id,displayName,formattedAddress,websiteUri,addressComponents',
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

        // Send restaurant basic info
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'restaurant_info',
            data: {
              name: restaurantName,
              websiteUrl,
              city,
              currency
            }
          })}\n\n`)
        );

        // Start scraping
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Scraping website and menu data...',
            step: 2,
            totalSteps: 5
          })}\n\n`)
        );

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

        // Send logo and colors
        if (logo || colors) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'branding',
              data: { logo, colors }
            })}\n\n`)
          );
        }

        // Start GPT parsing with streaming
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Parsing menu with AI...',
            step: 3,
            totalSteps: 5
          })}\n\n`)
        );

        const combinedContent = `
${websiteContent ? `${websiteContent}\n\n` : ''}
${googleMapsContent ? `${googleMapsContent}` : ''}
        `.trim();

        // Stream GPT results
        await streamParseMenuWithGPT(
          combinedContent || 'No text content available.',
          restaurantName,
          websiteContent.length > 0,
          (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'menu_chunk',
                data: chunk
              })}\n\n`)
            );
          }
        );

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Menu parsing complete!',
            step: 5,
            totalSteps: 5
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
