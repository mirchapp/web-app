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

  // Lock body scroll only for immersive tabs (videos/post). Allow scrolling elsewhere.
  React.useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const shouldLock = activeTab === 'videos' || activeTab === 'post';

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
