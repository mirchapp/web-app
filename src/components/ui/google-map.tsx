'use client';

import * as React from 'react';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

interface GoogleMapProps {
  className?: string;
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string;
}

// Global state to track script loading
let isScriptLoading = false;
let isScriptLoaded = false;
const scriptLoadPromise = new Promise<void>((resolve, reject) => {
  if (isScriptLoaded) {
    resolve();
    return;
  }

  if (isScriptLoading) {
    // Wait for existing load to complete
    const checkLoaded = () => {
      if (isScriptLoaded) {
        resolve();
      } else if (!isScriptLoading) {
        reject(new Error('Script loading failed'));
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
    return;
  }

  isScriptLoading = true;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    isScriptLoaded = true;
    isScriptLoading = false;
    resolve();
  };
  script.onerror = () => {
    isScriptLoading = false;
    reject(new Error('Failed to load Google Maps'));
  };
  
  document.head.appendChild(script);
});

export function GoogleMap({ 
  className = '',
  center = { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom = 13,
  height = '100%'
}: GoogleMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  // Load Google Maps script with singleton pattern
  React.useEffect(() => {
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    scriptLoadPromise
      .then(() => setIsLoaded(true))
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setIsLoaded(false);
      });
  }, []);

  // Initialize map when Google Maps is loaded
  React.useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const initMap = () => {
      // Check if map already exists in the ref
      if (mapRef.current && mapRef.current.children.length > 0) {
        return;
      }

      if (!mapRef.current) {
        return;
      }

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
    };

    if (window.google) {
      initMap();
    } else {
      window.initMap = initMap;
    }
  }, [isLoaded, center, zoom, map]);

  // Cleanup function to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (map) {
        // Clear all markers and listeners
        const google = window.google;
        if (google && google.maps) {
          google.maps.event.clearInstanceListeners(map);
        }
      }
    };
  }, [map]);

  // Update map center when prop changes
  React.useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
}
