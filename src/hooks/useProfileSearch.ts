import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ProfileSearchResult, ProfileSuggestion } from "@/types/search";
import { fetchSuggestedProfiles } from "@/lib/suggestions";

interface UseProfileSearchOptions {
  viewerId: string;
  limit?: number;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseProfileSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: ProfileSearchResult[];
  suggestions: ProfileSuggestion[];
  loading: boolean;
  suggesting: boolean;
  error: string | null;
}

export function useProfileSearch({
  viewerId,
  limit = 20,
  debounceMs = 200,
  minQueryLength = 1,
}: UseProfileSearchOptions): UseProfileSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch suggestions when query is empty
  const loadSuggestions = useCallback(async () => {
    console.log("loadSuggestions called", { viewerId });

    if (!viewerId || viewerId === "") {
      console.log("No viewerId, skipping suggestions");
      setSuggestions([]);
      return;
    }

    setSuggesting(true);
    setError(null);

    try {
      const data = await fetchSuggestedProfiles(viewerId, limit, false);
      console.log("Suggestions loaded:", data);
      setSuggestions(data);
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
      console.log("searchProfiles called", { searchQuery, viewerId, minQueryLength });

      if (!viewerId || viewerId === "" || searchQuery.length < minQueryLength) {
        console.log("Search aborted - conditions not met");
        setResults([]);
        return;
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      // Normalize query: strip "@" and lowercase
      const normalizedQuery = searchQuery.replace(/^@/, "").toLowerCase();
      console.log("Searching with normalized query:", normalizedQuery);

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

        console.log("Search results:", { data, error: rpcError });

        if (rpcError) {
          throw rpcError;
        }

        if (data && data.length > 0) {
          console.log("Setting results:", data);
          setResults(data);
          setSuggestions([]); // Clear suggestions when we have results
        } else {
          // Fall back to suggestions when no results
          console.log("No results, loading suggestions");
          setResults([]);
          await loadSuggestions();
        }
      } catch (err) {
        if (err && typeof err === "object" && "name" in err && err.name !== "AbortError") {
          setError("Failed to search profiles");
          console.error("Error searching profiles:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [viewerId, limit, minQueryLength, loadSuggestions]
  );

  // Handle query changes with debouncing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If query is empty, show suggestions immediately
    if (query.trim() === "") {
      setResults([]);
      setLoading(false);
      loadSuggestions();
      return;
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      searchProfiles(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, searchProfiles, loadSuggestions]);

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

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
    results,
    suggestions,
    loading,
    suggesting,
    error,
  };
}
