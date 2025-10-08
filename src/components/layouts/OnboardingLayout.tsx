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

  // Memoize star positions so they don't change on re-render (matching ProfileOverview)
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div
      className={cn("fixed bg-white dark:bg-[#0A0A0F]", className)}
      style={{
        // Compensate for the safe area padding on html element (like VideoFeed)
        top: `calc(-1 * env(safe-area-inset-top))`,
        left: `calc(-1 * env(safe-area-inset-left))`,
        right: `calc(-1 * env(safe-area-inset-right))`,
        bottom: `calc(-1 * env(safe-area-inset-bottom))`,
        paddingTop: `env(safe-area-inset-top)`,
        paddingLeft: `env(safe-area-inset-left)`,
        paddingRight: `env(safe-area-inset-right)`,
        paddingBottom: `env(safe-area-inset-bottom)`
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

      <div className="h-full overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 32px)' }}>
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
    </div>
  );
}
