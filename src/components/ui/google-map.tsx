'use client';

import * as React from 'react';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
    initGoogleMaps: () => void;
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
let scriptElement: HTMLScriptElement | null = null;

// Function to load Google Maps script
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
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

    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Document not available - running on server'));
      return;
    }

    // Remove existing script if it exists to force reload with new map_ids
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement);
      isScriptLoaded = false;
    }

    isScriptLoading = true;
    
    scriptElement = document.createElement('script');
    scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&map_ids=60478709f030ca4de60d8bf1`;
    scriptElement.async = true;
    scriptElement.defer = true;
    scriptElement.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
    };
    scriptElement.onerror = () => {
      isScriptLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(scriptElement);
  });
};

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
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    loadGoogleMapsScript()
      .then(() => setIsLoaded(true))
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setIsLoaded(false);
      });
  }, []);

  // Initialize map when Google Maps is loaded
  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (!isLoaded || !mapRef.current || map) return;

    const initMap = () => {
      // Check if map already exists in the ref
      if (mapRef.current && mapRef.current.children.length > 0) {
        return;
      }

      if (!mapRef.current) {
        return;
      }

      console.log('Initializing map with mapId: 60478709f030ca4de60d8bf1');

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: '60478709f030ca4de60d8bf1',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'greedy',
        disableDoubleClickZoom: false,
        scrollwheel: true
      });

      // Log map instance to verify mapId is applied
      console.log('Map instance created:', mapInstance);

      setMap(mapInstance);
    };

    if (window.google && window.google.maps) {
      initMap();
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
      className={`w-full touch-pan-x touch-pan-y map-container ${className}`}
      style={{ 
        height,
        touchAction: 'pan-x pan-y'
      }}
    />
  );
}
