'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';

export function Step5Complete() {
  const { data, completeOnboarding } = useOnboarding();
  const [isCompleting, setIsCompleting] = React.useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Call the context's completeOnboarding which handles the database update
      await completeOnboarding();

      // Redirect to diners app using client-side navigation
      window.location.href = 'https://diners.mirch.app';
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="text-center space-y-8 pt-8">
        <div className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_12px_40px_rgba(138,66,214,0.45)]">
          <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-thin bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            You&apos;re all set!
          </h2>
          <p className="text-muted-foreground/90 dark:text-muted-foreground/80 text-base max-w-sm mx-auto leading-relaxed">
            Welcome to Mirch, {data.display_name?.split(' ')[0]}! Let&apos;s start exploring
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-6 rounded-[14px] bg-white/70 dark:bg-white/[0.02] border border-primary/10 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] space-y-4">
          <h3 className="font-medium text-foreground/90">Your Profile Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground/80">Name:</span>
              <span className="font-medium text-foreground/90">{data.display_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground/80">Username:</span>
              <span className="font-medium text-foreground/90">@{data.username}</span>
            </div>
            {data.location && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground/80">Location:</span>
                <span className="font-medium text-foreground/90">{data.location}</span>
              </div>
            )}
            {data.favourite_cuisines && data.favourite_cuisines.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground/80">Favorites:</span>
                <span className="font-medium text-foreground/90">{data.favourite_cuisines.length} cuisines</span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-full h-14 rounded-[14px] font-medium text-base shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_24px_rgba(138,66,214,0.45)] active:scale-[0.98] transition-all duration-200"
        >
          {isCompleting ? 'Setting up...' : 'Start Exploring'}
        </Button>
      </div>
    </div>
  );
}
