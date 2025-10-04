'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, X, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useSafeArea } from '@/hooks/useSafeArea';

// Using the new Places API (New) - https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

interface PlacePhoto {
  name: string;
}

interface PlaceLocation {
  latitude: number;
  longitude: number;
}

interface Place {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  photos?: PlacePhoto[];
  location?: PlaceLocation;
}

interface PlacePrediction {
  placeId: string;
  text?: { text: string };
  structuredFormat?: {
    secondaryText?: { text: string };
  };
}

interface Suggestion {
  placePrediction?: PlacePrediction;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  photo?: string;
  distance?: string;
  placeId: string;
}

interface RestaurantSelectorProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export function RestaurantSelector({ onSelectRestaurant, onClose }: RestaurantSelectorProps) {
  const safeAreaInsets = useSafeArea();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<Restaurant[]>([]);
  const [recentRestaurants, setRecentRestaurants] = React.useState<Restaurant[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = React.useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [hasRequestedPermission, setHasRequestedPermission] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  // Note: Background scroll is locked by AppLayout when post tab is active

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const calculateDistance = React.useCallback((from: { lat: number; lng: number }, to: PlaceLocation) => {
    const R = 6371; // Earth's radius in km
    const dLat = (to.latitude - from.lat) * Math.PI / 180;
    const dLon = (to.longitude - from.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  }, []);

  // Numeric distance in KM for sorting
  const calculateDistanceKm = React.useCallback((from: { lat: number; lng: number }, to: PlaceLocation) => {
    const R = 6371;
    const dLat = (to.latitude - from.lat) * Math.PI / 180;
    const dLon = (to.longitude - from.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const fetchNearbyRestaurants = React.useCallback(async () => {
    if (!userLocation || !apiKey) return;

    try {
      setIsLoading(true);

      // Using the new Places API (New) nearbySearch
      const response = await fetch(`${PLACE_DETAILS_URL}:searchNearby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.photos,places.location',
        },
        body: JSON.stringify({
          includedTypes: ['restaurant'],
          maxResultCount: 10,
          locationRestriction: {
            circle: {
              center: {
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              },
              radius: 2000.0, // 2km radius
            },
          },
        }),
      });

      const data = await response.json();

      if (data.places) {
        const restaurants = data.places.map((place: Place) => {
          const distanceKm = place.location && userLocation ? calculateDistanceKm(userLocation, place.location) : Number.POSITIVE_INFINITY;
          return {
            id: place.id,
            name: place.displayName?.text || 'Unknown Restaurant',
            address: place.formattedAddress || '',
            rating: place.rating,
            photo: place.photos?.[0]?.name ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400` : undefined,
            distance: place.location && userLocation ? calculateDistance(userLocation, place.location) : undefined,
            placeId: place.id,
            _distanceKm: distanceKm,
          } as Restaurant & { _distanceKm: number };
        })
        .sort((a: Restaurant & { _distanceKm: number }, b: Restaurant & { _distanceKm: number }) => a._distanceKm - b._distanceKm)
        .map(({ _distanceKm: _unused, ...rest }: Restaurant & { _distanceKm: number }) => rest as Restaurant);

        setNearbyRestaurants(restaurants);
      }
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, apiKey, calculateDistance, calculateDistanceKm]);

  // Get user's location
  const requestUserLocation = React.useCallback(async () => {
    if (isRequestingLocation) return;
    setIsRequestingLocation(true);
    setLocationError(null);
    setHasRequestedPermission(true);

    const fallbackToIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!res.ok) throw new Error('ipapi request failed');
        const data = await res.json();
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setUserLocation({ lat: data.latitude, lng: data.longitude });
          setLocationError(null);
          return true;
        }
      } catch (e) {
        console.error('IP geolocation failed:', e);
      }
      return false;
    };

    if ('geolocation' in navigator) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLocationError(null);
            localStorage.setItem('locationPermissionGranted', 'true');
            resolve();
          },
          async (error) => {
            console.error('Error getting location:', error);
            localStorage.setItem('locationPermissionGranted', 'false');
            const ok = await fallbackToIP();
            if (!ok) {
              setLocationError('Location unavailable. Please enable Location Services or try again.');
            }
            resolve();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });
    } else {
      const ok = await fallbackToIP();
      if (!ok) {
        setLocationError('Geolocation not supported on this device.');
      }
    }
    setIsRequestingLocation(false);
  }, [isRequestingLocation]);

  // Auto-request location on mount if permission was previously granted
  React.useEffect(() => {
    const permissionGranted = localStorage.getItem('locationPermissionGranted');
    if (permissionGranted === 'true') {
      requestUserLocation();
    }
  }, [requestUserLocation]);

  // Load recent restaurants from localStorage
  React.useEffect(() => {
    const recent = localStorage.getItem('recentRestaurants');
    if (recent) {
      try {
        setRecentRestaurants(JSON.parse(recent));
      } catch (error) {
        console.error('Error parsing recent restaurants:', error);
      }
    }
  }, []);

  // Fetch nearby restaurants when location is available
  React.useEffect(() => {
    if (userLocation && apiKey) {
      fetchNearbyRestaurants();
    }
  }, [userLocation, apiKey, fetchNearbyRestaurants]);

  // Auto-focus search input
  React.useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  }, []);

  const searchRestaurants = async (query: string) => {
    if (!query.trim() || !apiKey) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);

      // Using the new Places API (New) Autocomplete
      const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input: query,
          includedPrimaryTypes: ['restaurant'],
          locationBias: userLocation ? {
            circle: {
              center: {
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              },
              radius: 5000.0,
            },
          } : undefined,
        }),
      });

      const data = await response.json();

      if (data.suggestions) {
        // Fetch details for each suggestion
        const detailsPromises = data.suggestions
          .filter((s: Suggestion) => s.placePrediction)
          .slice(0, 5)
          .map(async (suggestion: Suggestion) => {
            const placeId = suggestion.placePrediction!.placeId;

            try {
              const detailsResponse = await fetch(`${PLACE_DETAILS_URL}/${placeId}`, {
                method: 'GET',
                headers: {
                  'X-Goog-Api-Key': apiKey,
                  'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,photos,location',
                },
              });

              const placeDetails: Place = await detailsResponse.json();

              const distanceKm = (userLocation && placeDetails.location)
                ? calculateDistanceKm(userLocation, placeDetails.location)
                : Number.POSITIVE_INFINITY;
              return {
                id: placeDetails.id,
                name: placeDetails.displayName?.text || suggestion.placePrediction!.text?.text || 'Unknown Restaurant',
                address: placeDetails.formattedAddress || suggestion.placePrediction!.structuredFormat?.secondaryText?.text || '',
                rating: placeDetails.rating,
                photo: placeDetails.photos?.[0]?.name ? `https://places.googleapis.com/v1/${placeDetails.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400` : undefined,
                placeId: placeId,
                distance: (userLocation && placeDetails.location) ? calculateDistance(userLocation, placeDetails.location) : undefined,
                _distanceKm: distanceKm,
              } as Restaurant & { _distanceKm: number };
            } catch (error) {
              console.error('Error fetching place details:', error);
              return null;
            }
          });

        const restaurants = (await Promise.all(detailsPromises))
          .filter((r): r is (Restaurant & { _distanceKm?: number }) => r !== null)
          .sort((a, b) => (a._distanceKm ?? Number.POSITIVE_INFINITY) - (b._distanceKm ?? Number.POSITIVE_INFINITY))
          .map(({ _distanceKm: _unused, ...rest }) => rest as Restaurant);
        setSuggestions(restaurants);
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchRestaurants(query);
    }, 300);
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    // Save to recent restaurants
    const recent = [restaurant, ...recentRestaurants.filter(r => r.id !== restaurant.id)].slice(0, 5);
    localStorage.setItem('recentRestaurants', JSON.stringify(recent));
    setRecentRestaurants(recent);

    onSelectRestaurant(restaurant);
  };

  const renderRestaurantCard = (restaurant: Restaurant, showDistance = false) => (
    <motion.button
      key={restaurant.id}
      onClick={() => handleSelectRestaurant(restaurant)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors text-left touch-manipulation"
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        {restaurant.photo ? (
          <Image
            src={restaurant.photo}
            alt={restaurant.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <MapPin className="h-6 w-6 text-primary/60" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {restaurant.name}
          </h3>
          {restaurant.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-foreground">{restaurant.rating}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mb-0.5">
          {restaurant.address}
        </p>
        {showDistance && restaurant.distance && (
          <p className="text-xs text-primary/80 font-medium">
            {restaurant.distance}
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-background flex flex-col min-h-0"
      style={{
        paddingTop: `${Math.max(safeAreaInsets.top, 16)}px`,
        paddingBottom: `${Math.max(safeAreaInsets.bottom, 16)}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">Select Restaurant</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-12 pl-10 pr-4 rounded-2xl bg-muted/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
      >
        {/* Location CTA / Error - only show if no location and not currently requesting */}
        {!userLocation && !isRequestingLocation && hasRequestedPermission && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="text-xs text-muted-foreground">
              {locationError ? locationError : 'Enable location to see nearby restaurants by distance.'}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => requestUserLocation()}
            >
              Try again
            </Button>
          </div>
        )}
        {/* Initial location request prompt */}
        {!userLocation && !isRequestingLocation && !hasRequestedPermission && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="text-xs text-muted-foreground">
              Enable location to see nearby restaurants by distance.
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => requestUserLocation()}
            >
              Enable location
            </Button>
          </div>
        )}
        {/* Search Results */}
        {searchQuery && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Search Results</h2>
              {isLoading && (
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-2">
              {suggestions.length > 0 ? (
                suggestions.map((restaurant) => renderRestaurantCard(restaurant))
              ) : !isLoading && (
                <div className="py-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No restaurants found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Restaurants */}
        {!searchQuery && recentRestaurants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Recent</h2>
            </div>
            <div className="space-y-2">
              {recentRestaurants.map((restaurant) => renderRestaurantCard(restaurant))}
            </div>
          </div>
        )}

        {/* Nearby Restaurants */}
        {!searchQuery && nearbyRestaurants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Nearby</h2>
            </div>
            <div className="space-y-2">
              {nearbyRestaurants.map((restaurant) => renderRestaurantCard(restaurant, true))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && recentRestaurants.length === 0 && nearbyRestaurants.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">Find a restaurant</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Search for a restaurant to start creating your post
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
