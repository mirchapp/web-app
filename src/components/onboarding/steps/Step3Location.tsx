'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import { MapPin, Loader2, Navigation } from 'lucide-react';

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function Step3Location() {
  const { data, updateData, nextStep, saveProgress } = useOnboarding();
  const [location, setLocation] = React.useState(data.location || '');
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const isSelectingRef = React.useRef(false);

  // Fetch place suggestions using Google Places Autocomplete
  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input)}`
      );

      const data = await response.json();

      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    // Skip search if we're in the process of selecting a suggestion
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    const locationText = suggestion.description;

    // Set flag to prevent useEffect from triggering a new search
    isSelectingRef.current = true;

    setLocation(locationText);
    setQuery(locationText);
    setShowSuggestions(false);
    setSuggestions([]);

    // Clear any pending search timeout to prevent re-fetching
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-dropdown-container')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get city name
          const response = await fetch(
            `/api/places/geocode?latlng=${latitude},${longitude}`
          );

          const data = await response.json();

          if (data.results && data.results.length > 0) {
            // Find the locality (city), state, and country components
            const result = data.results[0];
            const cityComponent = result.address_components.find((comp: { types: string[] }) =>
              comp.types.includes('locality')
            );
            const stateComponent = result.address_components.find((comp: { types: string[] }) =>
              comp.types.includes('administrative_area_level_1')
            );
            const countryComponent = result.address_components.find((comp: { types: string[] }) =>
              comp.types.includes('country')
            );

            let locationText = '';
            if (cityComponent && stateComponent && countryComponent) {
              locationText = `${cityComponent.long_name}, ${stateComponent.short_name}, ${countryComponent.long_name}`;
            } else if (cityComponent && countryComponent) {
              locationText = `${cityComponent.long_name}, ${countryComponent.long_name}`;
            } else if (cityComponent) {
              locationText = cityComponent.long_name;
            } else {
              locationText = result.formatted_address;
            }

            // Set flag to prevent useEffect from triggering a new search
            isSelectingRef.current = true;

            setLocation(locationText);
            setQuery(locationText);
            setShowSuggestions(false);
            setSuggestions([]);
          }
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Failed to get your location. Please enter it manually.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Failed to get your location. Please enter it manually.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleContinue = async () => {
    const updates = { location };
    updateData(updates);
    await saveProgress(updates);
    nextStep();
  };

  const handleSkip = async () => {
    await saveProgress();
    nextStep();
  };

  return (
    <div className="relative space-y-12">
      {/* Subtle ambient glow background */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 dark:bg-primary/5 flex items-center justify-center shadow-[0_4px_12px_rgba(138,66,214,0.15)]">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-4xl font-thin bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          Where are you located?
        </h2>
        <p className="text-muted-foreground/90 dark:text-muted-foreground/80 text-base leading-relaxed">
          We&apos;ll show you restaurants nearby
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="location" className="text-sm font-medium text-foreground/80 pl-1">
            City, State/Province
          </Label>

          <div className="relative location-dropdown-container">
            <Input
              id="location"
              type="text"
              placeholder="Start typing a city..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="h-14 rounded-[14px] pr-10 border-border/20 dark:border-white/5 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_20px_rgba(138,66,214,0.15)] dark:focus:shadow-[0_4px_20px_rgba(138,66,214,0.2)] transition-all duration-300"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full top-full bg-background border border-border/50 rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden"
                >
                  <div className="max-h-[240px] overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(suggestion);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b border-border/20 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground/90">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-muted-foreground/70 truncate">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-xs text-muted-foreground/70 leading-relaxed pl-1">
            This helps us recommend restaurants in your area
          </p>
        </div>

        {/* Use Current Location Button */}
        <Button
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          className="w-full h-12 rounded-[14px] font-medium border-primary/20 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] hover:bg-primary/5 dark:hover:bg-white/[0.05] hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Use my current location
            </>
          )}
        </Button>

        <div className="flex flex-col gap-3 mt-8 pt-4">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              disabled={!location}
              className="w-full h-14 rounded-[14px] font-medium text-base bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_28px_rgba(138,66,214,0.5)] disabled:shadow-[0_2px_8px_rgba(138,66,214,0.2)] transition-all duration-300"
            >
              Continue
            </Button>
          </motion.div>

          <Button
            onClick={handleSkip}
            variant="outline"
            className="w-full h-14 rounded-[14px] font-medium border-primary/20 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] hover:bg-primary/5 dark:hover:bg-white/[0.05] hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
