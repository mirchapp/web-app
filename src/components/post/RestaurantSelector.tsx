'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, ChevronRight, Star } from 'lucide-react';
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
  onMediaSelected: (mediaData: string, isVideo: boolean) => void;
}

export function RestaurantSelector({ onSelectRestaurant, onMediaSelected }: RestaurantSelectorProps) {
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
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
  const [selectedCardKey, setSelectedCardKey] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Note: Background scroll is locked by AppLayout when post tab is active

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Memoize star positions so they don't change on re-render (matching ProfileOverview)
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

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
        .map(({ _distanceKm: _, ...rest }: Restaurant & { _distanceKm: number }) => rest as Restaurant);

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

  // Auto-focus search input (disabled to prevent border highlight on navigation)
  // React.useEffect(() => {
  //   setTimeout(() => {
  //     searchInputRef.current?.focus();
  //   }, 300);
  // }, []);

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
          .map(({ _distanceKm: _, ...rest }) => rest as Restaurant);
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

  // Crop an image dataURL to 9:16 aspect, center-cropped, output JPEG
  const cropToReelsAspect = React.useCallback(async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const targetAspect = 9 / 16; // portrait 9:16

        // Compute crop rectangle for object-fit: cover behavior
        let cropWidth = sourceWidth;
        let cropHeight = Math.round(sourceWidth / targetAspect);
        if (cropHeight > sourceHeight) {
          cropHeight = sourceHeight;
          cropWidth = Math.round(sourceHeight * targetAspect);
        }

        const sx = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
        const sy = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));

        // Output at 1080x1920 for quality (keeps file sizes reasonable)
        const outWidth = 1080;
        const outHeight = 1920;

        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, outWidth, outHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);

  const handleFileInput = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || !selectedRestaurant) {
      // User cancelled or no file selected
      if (selectedRestaurant) {
        // Save to recents and clear highlight
        const recent = [selectedRestaurant, ...recentRestaurants.filter(r => r.id !== selectedRestaurant.id)].slice(0, 5);
        localStorage.setItem('recentRestaurants', JSON.stringify(recent));
        setRecentRestaurants(recent);
        setSelectedRestaurant(null);
      }

      // Reset the input value
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    // Reset the input value to allow re-selecting the same file
    if (e.target) {
      e.target.value = '';
    }

    // Save to recent restaurants AFTER user has selected media
    const recent = [selectedRestaurant, ...recentRestaurants.filter(r => r.id !== selectedRestaurant.id)].slice(0, 5);
    localStorage.setItem('recentRestaurants', JSON.stringify(recent));
    setRecentRestaurants(recent);

    // Check if it's a video
    const isVideoFile = file.type.startsWith('video/');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const mediaData = event.target?.result as string;
      if (!mediaData) {
        setSelectedRestaurant(null);
        return;
      }

      if (isVideoFile) {
        onSelectRestaurant(selectedRestaurant);
        onMediaSelected(mediaData, true);
      } else {
        const cropped = await cropToReelsAspect(mediaData);
        onSelectRestaurant(selectedRestaurant);
        onMediaSelected(cropped, false);
      }
    };
    reader.readAsDataURL(file);
  }, [selectedRestaurant, recentRestaurants, onSelectRestaurant, onMediaSelected, cropToReelsAspect]);

  // Handle file input cancel event with multiple detection methods
  React.useEffect(() => {
    const fileInput = fileInputRef.current;
    if (!fileInput) return;

    const clearSelection = () => {
      if (selectedRestaurant) {
        // Save to recents
        const recent = [selectedRestaurant, ...recentRestaurants.filter(r => r.id !== selectedRestaurant.id)].slice(0, 5);
        localStorage.setItem('recentRestaurants', JSON.stringify(recent));
        setRecentRestaurants(recent);
        // Clear highlight immediately
        setSelectedRestaurant(null);
        setSelectedCardKey(null);
      }
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      // User cancelled the picker
      clearSelection();
    };

    let focusTimeout: NodeJS.Timeout;
    const handleWindowFocus = () => {
      // When window regains focus after file picker, check if file was selected
      // Immediate check for faster response
      focusTimeout = setTimeout(() => {
        const hasFiles = fileInput.files && fileInput.files.length > 0;
        if (selectedRestaurant && !hasFiles) {
          // No file selected, user cancelled
          clearSelection();
        }
      }, 50);
    };

    // Listen for the cancel event (fires when user dismisses picker without selecting)
    fileInput.addEventListener('cancel', handleCancel);

    // Fallback: listen for window focus (for browsers that don't support cancel event)
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      fileInput.removeEventListener('cancel', handleCancel);
      window.removeEventListener('focus', handleWindowFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
    };
  }, [selectedRestaurant, recentRestaurants]);

  const handleSelectRestaurant = (restaurant: Restaurant, cardKey: string) => {
    // Store selected restaurant and the specific card key (to identify which card was clicked)
    // DON'T save to recent yet - wait until user selects media
    setSelectedRestaurant(restaurant);
    setSelectedCardKey(cardKey);

    // Trigger file input after a small delay
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const renderRestaurantCard = (restaurant: Restaurant, showDistance = false, section = 'nearby') => {
    // Create unique card key combining restaurant ID and section
    const cardKey = `${section}-${restaurant.id}`;
    const isSelected = selectedCardKey === cardKey;

    return (
    <motion.button
      key={cardKey}
      onClick={() => handleSelectRestaurant(restaurant, cardKey)}
      className={`w-full flex items-center gap-4 p-4 rounded-[14px] text-left touch-manipulation relative overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-500/10 border-2 border-purple-400 dark:border-purple-500/50 shadow-lg'
          : 'bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] backdrop-blur-sm hover:border-purple-200 dark:hover:border-purple-500/20'
      }`}
      whileTap={{ scale: isSelected ? 1.0 : 0.98 }}
      whileHover={isSelected ? {} : {
        boxShadow: '0 4px 20px rgba(138, 66, 214, 0.15), 0 0 0 1px rgba(138, 66, 214, 0.1)',
        y: -2,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <motion.div
        className="relative h-16 w-16 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-muted ring-1 ring-gray-200 dark:ring-black/5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
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
            <MapPin className="h-7 w-7 text-primary/60" />
          </div>
        )}
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
            {restaurant.name}
          </h3>
          {restaurant.rating && (
            <motion.div
              className="flex items-center gap-1 flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-gray-900 dark:text-foreground">{restaurant.rating}</span>
            </motion.div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-muted-foreground/70 truncate mb-1 font-light">
          {restaurant.address}
        </p>
        {showDistance && restaurant.distance && (
          <p className="text-xs font-light text-gray-400 dark:text-muted-foreground/60">
            {restaurant.distance}
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-muted-foreground/50 flex-shrink-0" />
    </motion.button>
    );
  };

  return (
    <div
      className="absolute inset-0 overflow-y-auto bg-white dark:bg-[#0A0A0F]"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 88px)',
      }}
    >
      {/* Hidden file input - native media picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,video/mp4,video/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Animated purple wave background - matching profile page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Purple wave gradient */}
        <div
          className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
          style={{
            top: '10%',
            background: 'linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)',
            filter: 'blur(80px)',
            transform: 'translateZ(0)',
            animation: 'wave 8s ease-in-out infinite alternate'
          }}
        />

        {/* Subtle stars/particles */}
        <div className="absolute inset-0 opacity-15 dark:opacity-30">
          {starPositions.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                willChange: 'opacity',
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-6 relative z-10" style={{ paddingTop: 'var(--post-screen-top-padding-safe)' }}>
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="pt-6 pb-6"
      >
        <div className="flex flex-col mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-light mb-3 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
            Start a Post
          </h1>
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="text-sm text-gray-600 dark:text-muted-foreground/80 font-light leading-relaxed"
          >
            Step 1 of 3 — Choose a restaurant
          </motion.p>
        </div>

        {/* Search Bar - matching profile page input style */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-muted-foreground/60 pointer-events-none z-10" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-13 pl-12 pr-5 text-sm rounded-[13px] border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] font-light"
          />
        </div>
      </motion.div>

      {/* Content */}
      <div className="py-4 space-y-8">
        {/* Location CTA / Error - only show if no location and not currently requesting */}
        {!userLocation && !isRequestingLocation && hasRequestedPermission && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-[14px] bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="text-xs text-gray-600 dark:text-muted-foreground/70 font-light">
              {locationError ? locationError : 'Enable location to see nearby restaurants by distance.'}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg flex-shrink-0 border-gray-200 dark:border-white/5 font-light"
              onClick={() => requestUserLocation()}
            >
              Try again
            </Button>
          </div>
        )}
        {/* Initial location request prompt */}
        {!userLocation && !isRequestingLocation && !hasRequestedPermission && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-[14px] bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
            <div className="text-xs text-gray-600 dark:text-muted-foreground/70 font-light">
              Enable location to see nearby restaurants by distance.
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg flex-shrink-0 border-gray-200 dark:border-white/5 font-light"
              onClick={() => requestUserLocation()}
            >
              Enable location
            </Button>
          </div>
        )}
        {/* Search Results */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-light text-gray-500 dark:text-foreground/60 tracking-wide">Search Results</h2>
              {isLoading && (
                <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((restaurant) => renderRestaurantCard(restaurant, false, 'search'))
              ) : !isLoading && (
                <div className="py-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-300 dark:text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-muted-foreground/70 font-light">No restaurants found</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground/50 mt-2 font-light">Try a different search term</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recent Restaurants */}
        {!searchQuery && recentRestaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-4 w-4 text-gray-400 dark:text-muted-foreground/60" />
              <h2 className="text-sm font-light text-gray-500 dark:text-foreground/60 tracking-wide">Recent</h2>
            </div>
            <div className="space-y-3">
              {recentRestaurants.map((restaurant, index) => (
                <motion.div
                  key={`recent-${restaurant.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
                >
                  {renderRestaurantCard(restaurant, false, 'recent')}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Nearby Restaurants */}
        {!searchQuery && nearbyRestaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="h-4 w-4 text-gray-400 dark:text-muted-foreground/60" />
              <h2 className="text-sm font-light text-gray-500 dark:text-foreground/60 tracking-wide">Nearby</h2>
            </div>
            <div className="space-y-3">
              {nearbyRestaurants.map((restaurant, index) => (
                <motion.div
                  key={`nearby-${restaurant.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
                >
                  {renderRestaurantCard(restaurant, true, 'nearby')}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!searchQuery && recentRestaurants.length === 0 && nearbyRestaurants.length === 0 && !isLoading && (
          <div className="py-20 text-center">
            <div className="relative inline-block mb-6">
              <MapPin className="h-16 w-16 text-gray-300 dark:text-muted-foreground/30 mx-auto" />
              <div className="absolute inset-0 blur-xl opacity-30 bg-primary/20 rounded-full -z-10" />
            </div>
            <h3 className="text-base font-light text-gray-900 dark:text-foreground/80 mb-2">Find a restaurant</h3>
            <p className="text-sm text-gray-600 dark:text-muted-foreground/60 max-w-xs mx-auto leading-relaxed font-light">
              Search for a restaurant to start creating your post
            </p>
          </div>
        )}
      </div>
      </motion.div>
        </div>
      </div>
    </div>
  );
}
