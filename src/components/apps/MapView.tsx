'use client';

import * as React from 'react';
import { GoogleMap } from '@/components/ui/google-map';

export function MapView() {
  const [userLocation, setUserLocation] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      // Fallback to default location (San Francisco)
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
      },
      (error) => {
        console.error('Error getting location:', error);
        // Fallback to default location (San Francisco)
        setUserLocation({ lat: 37.7749, lng: -122.4194 });
      }
    );
  };

  // Get location on component mount
  React.useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="h-full">
      <GoogleMap
        center={userLocation || { lat: 37.7749, lng: -122.4194 }}
        zoom={13}
        height="100%"
        className="w-full"
      />
    </div>
  );
}
