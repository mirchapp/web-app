'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Placeholder components for each tab
const DiscoverTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Discover</h2>
    <p className="text-muted-foreground">Find amazing restaurants and dishes</p>
  </div>
);

const MapTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Map</h2>
    <p className="text-muted-foreground">Explore restaurants near you</p>
  </div>
);

const FavouritesTab = () => (
  <div className="p-6 text-center">
    <h2 className="text-2xl font-semibold mb-4">Favourites</h2>
    <p className="text-muted-foreground">Your saved restaurants and dishes</p>
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
  favourites: FavouritesTab,
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
      {/* Main content area with bottom padding for navigation */}
      <main className="pb-16">
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
            className="h-full"
          >
            {children || <ActiveComponent />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
    </div>
  );
}
