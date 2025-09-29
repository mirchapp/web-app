# Google Maps Integration Setup

This app includes Google Maps integration for the Map tab. Follow these steps to set it up:

## 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (for search functionality)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

## 2. Set Environment Variable

Create a `.env.local` file in your project root and add:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## 3. Features Included

- **Interactive Google Map** with full controls
- **User location detection** with "My Location" button
- **Search functionality** (ready for implementation)
- **Responsive design** that works on mobile and desktop
- **TypeScript support** with proper type definitions
- **Loading states** and error handling

## 4. Usage

The map will automatically load when you navigate to the Map tab. The component includes:

- Automatic geolocation detection
- Fallback to San Francisco if location access is denied
- Clean, modern UI with search and location buttons
- Full-screen map experience on mobile

## 5. Customization

You can customize the map by modifying the `GoogleMap` component:

- Change default center location
- Adjust zoom level
- Modify map styles
- Add custom markers
- Implement search functionality

## Security Notes

- Always restrict your API key to specific domains
- Monitor your API usage in the Google Cloud Console
- Consider implementing rate limiting for production use
