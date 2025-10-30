import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProfileSearchResult, ProfileSuggestion } from "@/types/search";
import { fetchSuggestedProfiles } from "@/lib/suggestions";

const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

export interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  placeId: string;
  photo?: string;
  distance?: string;
  // Database fields
  inDatabase?: boolean;
  logo_url?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  verified?: boolean;
}

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

interface UseCombinedSearchOptions {
  viewerId: string;
  limit?: number;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseCombinedSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  profileResults: ProfileSearchResult[];
  restaurantResults: RestaurantResult[];
  profileSuggestions: ProfileSuggestion[];
  loading: boolean;
  suggesting: boolean;
  error: string | null;
}

export function useCombinedSearch({
  viewerId,
  limit = 20,
  debounceMs = 300,
  minQueryLength = 1,
}: UseCombinedSearchOptions): UseCombinedSearchReturn {
  const [query, setQuery] = useState("");
  const [profileResults, setProfileResults] = useState<ProfileSearchResult[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<RestaurantResult[]>([]);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Get user location on mount - always try to get location
  useEffect(() => {
    const getUserLocation = async () => {
      // Try to get location even without previous permission
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Got user location:', position.coords.latitude, position.coords.longitude);
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          async (error) => {
            console.error('Error getting location:', error);
            // Fallback to IP geolocation
            try {
              const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
                  console.log('Got IP location:', data.latitude, data.longitude);
                  setUserLocation({ lat: data.latitude, lng: data.longitude });
                }
              }
            } catch (e) {
              console.error('IP geolocation failed:', e);
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
      }
    };

    getUserLocation();
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((from: { lat: number; lng: number }, to: PlaceLocation) => {
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

  // Calculate numeric distance in km for sorting
  const calculateDistanceKm = useCallback((from: { lat: number; lng: number }, to: PlaceLocation) => {
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

  // Fetch profile suggestions when query is empty
  const loadProfileSuggestions = useCallback(async () => {
    if (!viewerId || viewerId === "") {
      setProfileSuggestions([]);
      return;
    }

    setSuggesting(true);
    setError(null);

    try {
      const data = await fetchSuggestedProfiles(viewerId, limit, false);
      setProfileSuggestions(data);
    } catch (err) {
      setError("Failed to load suggestions");
      console.error("Error loading suggestions:", err);
    } finally {
      setSuggesting(false);
    }
  }, [viewerId, limit]);

  // Search for profiles
  const searchProfiles = useCallback(
    async (searchQuery: string) => {
      if (!viewerId || viewerId === "" || searchQuery.length < minQueryLength) {
        setProfileResults([]);
        return;
      }

      const normalizedQuery = searchQuery.replace(/^@/, "").toLowerCase();

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc(
          "search_profile_matches",
          {
            q: normalizedQuery,
            viewer: viewerId,
            n: limit,
          }
        );

        if (rpcError) {
          throw rpcError;
        }

        if (data && data.length > 0) {
          setProfileResults(data);
        } else {
          setProfileResults([]);
        }
      } catch (err) {
        if (err && typeof err === "object" && "name" in err && err.name !== "AbortError") {
          console.error("Error searching profiles:", err);
        }
      }
    },
    [viewerId, limit, minQueryLength]
  );

  // Search for restaurants using Google Places API
  const searchRestaurants = useCallback(
    async (searchQuery: string) => {
      if (!apiKey || searchQuery.length < minQueryLength) {
        setRestaurantResults([]);
        return;
      }

      try {
        console.log('Searching restaurants with location:', userLocation);
        const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({
            input: searchQuery,
            includedPrimaryTypes: ['restaurant'],
            ...(userLocation ? {
              locationBias: {
                circle: {
                  center: {
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                  },
                  radius: 50000.0, // 50km radius
                },
              },
            } : {}),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch restaurant suggestions');
        }

        const data = await response.json();
        const suggestions = data.suggestions || [];

        // Fetch details for each suggestion to get photos and location
        const detailsPromises = suggestions
          .filter((s: { placePrediction?: { placeId?: string } }) => s.placePrediction?.placeId)
          .slice(0, 10) // Get more results so we can sort by distance
          .map(async (s: {
            placePrediction: {
              placeId: string;
              text?: { text: string };
              structuredFormat?: { secondaryText?: { text: string } }
            }
          }) => {
            const placeId = s.placePrediction.placeId;

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
                name: placeDetails.displayName?.text || s.placePrediction.text?.text || 'Unknown Restaurant',
                address: placeDetails.formattedAddress || s.placePrediction.structuredFormat?.secondaryText?.text || '',
                rating: placeDetails.rating,
                photo: placeDetails.photos?.[0]?.name
                  ? `https://places.googleapis.com/v1/${placeDetails.photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`
                  : undefined,
                placeId: placeId,
                distance: (userLocation && placeDetails.location)
                  ? calculateDistance(userLocation, placeDetails.location)
                  : undefined,
                _distanceKm: distanceKm,
              };
            } catch (error) {
              console.error('Error fetching place details:', error);
              return null;
            }
          });

        const restaurants = (await Promise.all(detailsPromises))
          .filter((r): r is (RestaurantResult & { _distanceKm?: number }) => r !== null)
          .sort((a, b) => (a._distanceKm ?? Number.POSITIVE_INFINITY) - (b._distanceKm ?? Number.POSITIVE_INFINITY))
          .slice(0, 5) // Take only the 5 closest
          .map(({ _distanceKm: _, ...rest }) => rest as RestaurantResult);

        // Check which restaurants exist in our database
        const supabase = createClient();
        const placeIds = restaurants.map(r => r.placeId);

        const { data: dbRestaurants } = await supabase
          .from('Restaurant')
          .select('google_place_id, logo_url, primary_colour, secondary_colour, accent_colour, verified')
          .in('google_place_id', placeIds);

        // Merge DB data with restaurant results
        const enrichedRestaurants = restaurants.map(restaurant => {
          const dbData = dbRestaurants?.find(db => db.google_place_id === restaurant.placeId);
          if (dbData) {
            return {
              ...restaurant,
              inDatabase: true,
              logo_url: dbData.logo_url || undefined,
              primaryColor: dbData.primary_colour || undefined,
              secondaryColor: dbData.secondary_colour || undefined,
              accentColor: dbData.accent_colour || undefined,
              verified: dbData.verified || false,
            };
          }
          return restaurant;
        });

        console.log('Restaurant results:', enrichedRestaurants.map(r => ({ name: r.name, distance: r.distance, inDatabase: r.inDatabase })));
        setRestaurantResults(enrichedRestaurants);
      } catch (err) {
        console.error("Error searching restaurants:", err);
        setRestaurantResults([]);
      }
    },
    [apiKey, minQueryLength, userLocation, calculateDistance, calculateDistanceKm]
  );

  // Combined search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        // Search both profiles and restaurants in parallel
        await Promise.all([
          searchProfiles(searchQuery),
          searchRestaurants(searchQuery),
        ]);
      } catch (err) {
        if (err && typeof err === "object" && "name" in err && err.name !== "AbortError") {
          setError("Failed to search");
          console.error("Error performing search:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchProfiles, searchRestaurants]
  );

  // Handle query changes with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, show profile suggestions
    if (query.trim() === "") {
      setProfileResults([]);
      setRestaurantResults([]);
      setLoading(false);
      loadProfileSuggestions();
      return;
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, performSearch, loadProfileSuggestions]);

  // Load profile suggestions on mount
  useEffect(() => {
    loadProfileSuggestions();
  }, [loadProfileSuggestions]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    profileResults,
    restaurantResults,
    profileSuggestions,
    loading,
    suggesting,
    error,
  };
}
