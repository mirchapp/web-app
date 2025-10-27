import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProfileSearchResult, ProfileSuggestion } from "@/types/search";
import { fetchSuggestedProfiles } from "@/lib/suggestions";

const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

export interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  placeId: string;
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

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
        const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify({
            input: searchQuery,
            includedPrimaryTypes: ['restaurant'],
            languageCode: 'en',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch restaurant suggestions');
        }

        const data = await response.json();
        const suggestions = data.suggestions || [];

        const restaurants: RestaurantResult[] = suggestions
          .filter((s: { placePrediction?: { placeId?: string } }) => s.placePrediction?.placeId)
          .slice(0, 5) // Limit to 5 restaurant results
          .map((s: {
            placePrediction: {
              placeId: string;
              text?: { text: string };
              structuredFormat?: { secondaryText?: { text: string } }
            }
          }) => ({
            id: s.placePrediction.placeId,
            name: s.placePrediction.text?.text || 'Unknown Restaurant',
            address: s.placePrediction.structuredFormat?.secondaryText?.text || '',
            placeId: s.placePrediction.placeId,
          }));

        setRestaurantResults(restaurants);
      } catch (err) {
        console.error("Error searching restaurants:", err);
        setRestaurantResults([]);
      }
    },
    [apiKey, minQueryLength]
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
