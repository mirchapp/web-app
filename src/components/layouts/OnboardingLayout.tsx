'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  showBack = false,
  className
}: OnboardingLayoutProps) {
  const _progress = (currentStep / totalSteps) * 100;

  return (
    <div
      className={cn("absolute inset-0 overflow-y-auto bg-white dark:bg-[#0A0A0F]", className)}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 32px)',
      }}
    >
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
        {/* Secondary glow */}
        <div
          className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(192, 132, 252, 0.3), transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse'
          }}
        />
      </div>

      <div className="container mx-auto px-5 sm:px-6 relative z-10" style={{ paddingTop: 'var(--profile-top-padding-safe)' }}>
        <div className="max-w-md mx-auto">
          {/* Step indicator with back button */}
          <div className="relative flex items-center justify-center mb-8">
            {showBack && onBack && (
              <div className="absolute left-0">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full text-gray-600 dark:text-muted-foreground/80 hover:text-gray-900 dark:hover:text-muted-foreground hover:bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-muted-foreground/80 text-center leading-relaxed font-light">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Main content */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
