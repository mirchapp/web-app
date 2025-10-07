'use client';

import * as React from 'react';
import { OnboardingData } from '@/types/profile';
import { createClient } from '@/utils/supabase/client';

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveProgress: (overrideData?: Partial<OnboardingData>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = React.createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<OnboardingData>({});
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const supabase = createClient();

  // Load existing profile data on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);

        const { data: profile, error } = await supabase
          .from('Profile')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }

        if (profile) {
          // Populate data from existing profile
          setData({
            display_name: profile.display_name || undefined,
            username: profile.username || undefined,
            avatar_url: profile.avatar_url || undefined,
            location: profile.location || undefined,
            favourite_cuisines: profile.favourite_cuisines || undefined,
            dietary_preferences: profile.dietary_preferences || undefined,
            spice_preference: profile.spice_preference || undefined,
            price_preference: profile.price_preference || undefined,
          });

          // Set current step from database
          setCurrentStep(profile.signup_step || 1);
        }
      } catch (error) {
        console.error('Error in loadProfile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [supabase]);

  const updateData = React.useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = React.useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, []);

  const prevStep = React.useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const saveProgress = React.useCallback(async (overrideData?: Partial<OnboardingData>) => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    try {
      // Use override data if provided, otherwise use current state
      const dataToSave = overrideData ? { ...data, ...overrideData } : data;

      // Prepare update data
      const updateData: any = {
        signup_step: currentStep,
        updated_at: new Date().toISOString(),
      };

      // Add fields from onboarding data
      if (dataToSave.display_name) updateData.display_name = dataToSave.display_name;
      if (dataToSave.username) updateData.username = dataToSave.username;
      if (dataToSave.avatar_url) updateData.avatar_url = dataToSave.avatar_url;
      if (dataToSave.location) updateData.location = dataToSave.location;
      if (dataToSave.favourite_cuisines) updateData.favourite_cuisines = dataToSave.favourite_cuisines;
      if (dataToSave.dietary_preferences) updateData.dietary_preferences = dataToSave.dietary_preferences;
      if (dataToSave.spice_preference !== undefined) updateData.spice_preference = dataToSave.spice_preference;
      if (dataToSave.price_preference !== undefined) updateData.price_preference = dataToSave.price_preference;

      const { error } = await supabase
        .from('Profile')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving progress:', error);
        throw error;
      }

      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Error in saveProgress:', error);
      throw error;
    }
  }, [data, currentStep, userId, supabase]);

  const completeOnboarding = React.useCallback(async () => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    try {
      const { error } = await supabase
        .from('Profile')
        .update({
          signup_completed: true,
          signup_step: 5,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error completing onboarding:', error);
        throw error;
      }

      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
      throw error;
    }
  }, [userId, supabase]);

  const value = {
    data,
    updateData,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    saveProgress,
    completeOnboarding,
    isLoading
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
