'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { MapView } from '@/components/apps/MapView';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Placeholder components for each tab
const DiscoverTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Find</h2>
    <p className="text-muted-foreground">Find amazing restaurants and dishes</p>
  </div>
);

const MapTab = () => <MapView />;

const LikedTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Liked</h2>
    <p className="text-muted-foreground">Your saved restaurants and dishes</p>
  </div>
);

const VideosTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Videos</h2>
    <p className="text-muted-foreground">Discover amazing food content and cooking tutorials</p>
  </div>
);

const ProfileTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Profile</h2>
    <p className="text-muted-foreground">Manage your account and preferences</p>
  </div>
);

const tabComponents = {
  discover: DiscoverTab,
  map: MapTab,
  liked: LikedTab,
  videos: VideosTab,
  profile: ProfileTab,
};

export function AppLayout({ children, className }: AppLayoutProps) {
  const [activeTab, setActiveTab] = React.useState('discover');

  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const ActiveComponent = tabComponents[activeTab as keyof typeof tabComponents];

  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {/* Main content area with bottom padding for floating navigation */}
      <main className={cn(
        "pb-24 sm:pb-28",
        activeTab === 'map' ? "h-screen" : ""
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut",
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={cn(
              "h-full",
              activeTab === 'map' ? "h-screen" : ""
            )}
          >
            {children || <ActiveComponent />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Floating Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
    </div>
  );
}
