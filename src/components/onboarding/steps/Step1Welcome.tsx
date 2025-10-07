'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '../OnboardingContext';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export function Step1Welcome() {
  const { nextStep } = useOnboarding();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-2">
          {mounted && (
            <Image
              src={isDark ? '/mirch-logo-transparent.png' : '/mirch-logo-transparent-dark.png'}
              alt="Mirch Logo"
              width={240}
              height={240}
              className="w-auto h-20"
              priority
              quality={100}
            />
          )}
        </div>

        <h1 className="text-4xl font-thin bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          Reimagine Dining
        </h1>

        <p className="text-muted-foreground/90 dark:text-muted-foreground/80 text-base max-w-sm mx-auto leading-relaxed">
          Let&apos;s get you set up so you can start discovering amazing food experiences
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-3">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
              title: 'Discover',
              description: 'Find dishes and restaurants with AI-powered search tailored to your tastes'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: 'Share',
              description: 'Post and save pictures of your favorite food moments'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: 'Connect',
              description: 'Discover new places based on your preferences and what friends love'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 rounded-[14px] bg-white/70 dark:bg-white/[0.02] border border-primary/10 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(138,66,214,0.15)] active:scale-[0.98] transition-all duration-200"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/5 flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground/90 mb-0.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <Button
            onClick={nextStep}
            className="w-full h-14 rounded-[14px] font-medium text-base shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_24px_rgba(138,66,214,0.45)] active:scale-[0.98] transition-all duration-200 mt-2"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
