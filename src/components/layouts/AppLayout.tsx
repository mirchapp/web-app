'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { FindHome } from '@/components/apps/FindHome';
import { LikedHome } from '@/components/apps/LikedHome';
import { cn } from '@/lib/utils';
import { VideoFeed } from '@/components/video/VideoFeed';
import mockVideos from '@/data/mock/videos.json';
import { PostScreen, PostEditorContext } from '@/components/apps/PostScreen';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Placeholder components for each tab
const FindTab = () => <FindHome />;
const LikedTab = () => <LikedHome />;
const PostTab = () => <PostScreen />;
const VideosTab = () => <VideoFeed videos={mockVideos} />;
const ProfileTab = () => <ProfileOverview />;

export function AppLayout({ children, className }: AppLayoutProps) {
  const [activeTab, setActiveTab] = React.useState('videos');
  const [isInPostEditor, setIsInPostEditor] = React.useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = React.useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check if user needs to complete onboarding
  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile, error } = await supabase
            .from('Profile')
            .select('signup_completed, signup_step')
            .eq('user_id', user.id)
            .single();

          if (error) {
            // Table might not exist yet or no profile created - skip onboarding check
            console.warn('Could not fetch profile, skipping onboarding check:', error.message);
            setIsCheckingOnboarding(false);
            return;
          }

          if (profile && !profile.signup_completed) {
            // Don't redirect if already on onboarding page
            if (window.location.pathname === '/onboarding') {
              setIsCheckingOnboarding(false);
              return;
            }

            // User has not completed onboarding, redirect to diners onboarding
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            const port = window.location.port;

            // Check if we're already on diners subdomain
            const isOnDinersSubdomain = hostname.startsWith('diners.');

            // Determine the diners domain
            let dinersUrl;
            if (hostname.includes('localhost')) {
              // For localhost, use diners.localhost
              if (isOnDinersSubdomain) {
                // Already on diners.localhost, just go to /onboarding
                router.push('/onboarding');
                return;
              }
              dinersUrl = `${protocol}//diners.localhost${port ? ':' + port : ':3000'}/onboarding`;
            } else if (hostname.includes('mirch.app')) {
              // For production, use diners.mirch.app
              if (isOnDinersSubdomain) {
                // Already on diners.mirch.app, just go to /onboarding
                router.push('/onboarding');
                return;
              }
              dinersUrl = `${protocol}//diners.mirch.app/onboarding`;
            } else {
              // Fallback - stay on current domain
              router.push('/onboarding');
              return;
            }

            window.location.href = dinersUrl;
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [router, supabase]);

  // Lock body scroll only for immersive tabs (videos/post/profile). Allow scrolling elsewhere.
  React.useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const shouldLock = activeTab === 'videos' || activeTab === 'post' || activeTab === 'profile';

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      htmlOverflow: html.style.overflow,
    };

    if (shouldLock) {
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.width = '100%';
      body.style.height = '100%';
      html.style.overflow = 'hidden';
    } else {
      body.style.overflow = '';
      body.style.position = '';
      body.style.width = '';
      body.style.height = '';
      html.style.overflow = '';
    }

    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.width = prev.bodyWidth;
      body.style.height = prev.bodyHeight;
      html.style.overflow = prev.htmlOverflow;
    };
  }, [activeTab]);

  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'discover':
        return <FindTab />;
      case 'liked':
        return <LikedTab />;
      case 'post':
        return <PostTab />;
      case 'videos':
        return <VideosTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <FindTab />;
    }
  };

  // Show loading state while checking onboarding
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo skeleton */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 animate-pulse" />
          </div>
          {/* Content skeletons */}
          <div className="space-y-4">
            <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
            <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
            <div className="h-32 bg-muted/50 rounded-2xl animate-pulse" />
          </div>
          {/* Bottom nav skeleton */}
          <div className="fixed bottom-0 left-0 right-0 h-20 bg-muted/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <PostEditorContext.Provider value={{ isInEditor: isInPostEditor, setIsInEditor: setIsInPostEditor }}>
      <div className={cn("min-h-screen bg-background text-foreground", className)}>
        {/* Main content area with bottom padding for floating navigation */}
        <main
          className={cn(
            activeTab === 'videos' || activeTab === 'post' ? "fixed inset-0" : ""
          )}
          style={{
            height: activeTab === 'videos' || activeTab === 'post'
              ? '100dvh'
              : 'auto',
            paddingBottom: '0',
            overflow: activeTab === 'videos' || activeTab === 'post' ? 'hidden' : 'visible'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="h-full"
              style={{ overflow: activeTab === 'profile' ? 'visible' : undefined }}
            >
              {children || renderActiveComponent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Bottom Navigation - Hidden when in post editor */}
        {!isInPostEditor && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </div>
    </PostEditorContext.Provider>
  );
}
