'use client';

import * as React from 'react';
import { OnboardingLayout } from '@/components/layouts/OnboardingLayout';
import { OnboardingProvider, useOnboarding } from '@/components/onboarding/OnboardingContext';
import { Step1Welcome } from '@/components/onboarding/steps/Step1Welcome';
import { Step2Profile } from '@/components/onboarding/steps/Step2Profile';
import { Step3Location } from '@/components/onboarding/steps/Step3Location';
import { Step4Preferences } from '@/components/onboarding/steps/Step4Preferences';
import { Step5Complete } from '@/components/onboarding/steps/Step5Complete';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

function OnboardingContent() {
  const { currentStep, prevStep, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 space-y-8">
          {/* Logo skeleton */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="space-y-3">
            <div className="h-10 bg-muted/50 rounded-lg w-3/4 mx-auto animate-pulse" />
            <div className="h-4 bg-muted/30 rounded w-1/2 mx-auto animate-pulse" />
          </div>

          {/* Content skeletons */}
          <div className="space-y-4">
            <div className="h-14 bg-muted/50 rounded-[14px] animate-pulse" />
            <div className="h-14 bg-muted/50 rounded-[14px] animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="h-14 bg-primary/20 rounded-[14px] animate-pulse" />
        </div>
      </div>
    );
  }

  const steps = {
    1: <Step1Welcome />,
    2: <Step2Profile />,
    3: <Step3Location />,
    4: <Step4Preferences />,
    5: <Step5Complete />
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={5}
      onBack={prevStep}
      showBack={currentStep > 1 && currentStep < 5}
    >
      {steps[currentStep as keyof typeof steps]}
    </OnboardingLayout>
  );
}

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in, redirect to login
          router.push('/login');
          return;
        }

        // Check if onboarding is already completed
        const { data: profile, error } = await supabase
          .from('Profile')
          .select('signup_completed, signup_step')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.warn('Could not fetch profile:', error.message);
          // Allow them to proceed if profile doesn't exist
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        if (profile?.signup_completed) {
          // Already completed onboarding, redirect to main app
          router.push('/');
          return;
        }

        // User needs to complete onboarding
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error in onboarding check:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 space-y-8">
          {/* Logo skeleton */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 animate-pulse" />
          </div>

          {/* Title skeleton */}
          <div className="space-y-3">
            <div className="h-10 bg-muted/50 rounded-lg w-3/4 mx-auto animate-pulse" />
            <div className="h-4 bg-muted/30 rounded w-1/2 mx-auto animate-pulse" />
          </div>

          {/* Content skeletons */}
          <div className="space-y-4">
            <div className="h-14 bg-muted/50 rounded-[14px] animate-pulse" />
            <div className="h-14 bg-muted/50 rounded-[14px] animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="h-14 bg-primary/20 rounded-[14px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
