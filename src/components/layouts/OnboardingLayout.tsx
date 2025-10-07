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
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-background to-muted/20", className)}>
      {/* Animated floating glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-[0.15] dark:opacity-20 blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(138, 66, 214, 0.5), transparent 70%)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        <div
          className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] rounded-full opacity-[0.12] dark:opacity-15 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(192, 132, 252, 0.4), transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse'
          }}
        />
      </div>

      {/* Step indicator with back button */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 pt-6 pb-4">
          <div className="max-w-md mx-auto relative flex items-center justify-center">
            {showBack && onBack && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute left-0"
              >
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full text-muted-foreground/80 hover:text-muted-foreground hover:bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="text-sm text-muted-foreground/80 text-center leading-relaxed"
            >
              Step {currentStep} of {totalSteps}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 min-h-screen pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="container mx-auto px-4"
        >
          <div className="max-w-md mx-auto">
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
