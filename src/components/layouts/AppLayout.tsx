'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { MapView } from '@/components/apps/MapView';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { FindHome } from '@/components/apps/FindHome';
import { LikedHome } from '@/components/apps/LikedHome';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Heart, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Placeholder components for each tab
const DiscoverTab = () => <FindHome />;

const MapTab = () => <MapView />;

const LikedTab = () => <LikedHome />;

const VideosTab = () => {
  const [isDarkBackground, setIsDarkBackground] = React.useState(true);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const detectBackground = () => {
      if (!buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      
      try {
        // Temporarily hide buttons to sample what's behind
        const originalVisibility = buttonRef.current.style.visibility;
        buttonRef.current.style.visibility = 'hidden';
        
        // Sample point at button position
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const elementsAtPoint = document.elementsFromPoint(x, y);
        
        let totalLuminance = 0;
        let found = false;
        
        for (const element of elementsAtPoint) {
          const styles = window.getComputedStyle(element);
          const bgColor = styles.backgroundColor;
          
          const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            
            if (a > 0.1) {
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              totalLuminance = luminance;
              found = true;
              break;
            }
          }
        }
        
        buttonRef.current.style.visibility = originalVisibility;
        
        if (found) {
          setIsDarkBackground(totalLuminance < 0.5);
        }
      } catch {
        if (buttonRef.current) {
          buttonRef.current.style.visibility = '';
        }
        setIsDarkBackground(true);
      }
    };
    
    detectBackground();
    const interval = setInterval(detectBackground, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      {/* Fullscreen Food Image */}
      <div className="relative w-full h-full">
        <Image
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1920&fit=crop"
          alt="Delicious food"
          fill
          className="object-cover"
          unoptimized
          priority
        />
        
        {/* Action Buttons - Right Side */}
        <div 
          ref={buttonRef}
          className="absolute right-4 flex flex-col items-center gap-6 z-10 transition-colors duration-300"
          style={{
            bottom: 'calc(8rem + var(--safe-area-inset-bottom))',
          }}
        >
          {/* Like Button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-12 w-12 rounded-full backdrop-blur-sm transition-all duration-300",
                isDarkBackground 
                  ? "bg-black/30 hover:bg-black/40" 
                  : "bg-white/30 hover:bg-white/40"
              )}
            >
              <Heart className={cn(
                "h-6 w-6 transition-colors duration-300",
                isDarkBackground ? "text-white" : "text-gray-800"
              )} />
            </Button>
            <span 
              className={cn(
                "text-xs font-semibold transition-colors duration-300",
                isDarkBackground ? "text-white" : "text-gray-800"
              )}
              style={{ 
                textShadow: isDarkBackground 
                  ? '0 1px 4px rgba(0,0,0,0.8)' 
                  : '0 1px 2px rgba(255,255,255,0.6)' 
              }}
            >
              2.4k
            </span>
          </div>
          
          {/* Save Button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-12 w-12 rounded-full backdrop-blur-sm transition-all duration-300",
                isDarkBackground 
                  ? "bg-black/30 hover:bg-black/40" 
                  : "bg-white/30 hover:bg-white/40"
              )}
            >
              <Bookmark className={cn(
                "h-6 w-6 transition-colors duration-300",
                isDarkBackground ? "text-white" : "text-gray-800"
              )} />
            </Button>
            <span 
              className={cn(
                "text-xs font-semibold transition-colors duration-300",
                isDarkBackground ? "text-white" : "text-gray-800"
              )}
              style={{ 
                textShadow: isDarkBackground 
                  ? '0 1px 4px rgba(0,0,0,0.8)' 
                  : '0 1px 2px rgba(255,255,255,0.6)' 
              }}
            >
              Save
            </span>
          </div>
        </div>

        {/* Creator Info - Bottom Overlay */}
        <div 
          className="absolute left-0 right-0 px-5"
          style={{
            bottom: 'calc(5rem + var(--safe-area-inset-bottom))',
            paddingBottom: '1.5rem',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-white/50 flex-shrink-0">
              <Image
                src="/faizaan.jpeg"
                alt="Faizaan Qureshi"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  Faizaan Qureshi
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 rounded-full border border-white/60 bg-transparent text-white hover:bg-white/20 hover:text-white hover:border-white text-xs font-medium"
                  style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                >
                  Follow
                </Button>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm text-white/90 font-medium" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                  The Spice House
                </p>
                <p className="text-xs text-white/75" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                  Thai Basil Beef with Cashews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileTab = () => <ProfileOverview />;

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
      <main 
        className={cn(
          activeTab === 'map' || activeTab === 'videos' ? "h-screen" : ""
        )}
        style={
          activeTab !== 'map' && activeTab !== 'videos' 
            ? { paddingBottom: 'calc(6rem + var(--safe-area-inset-bottom))' }
            : undefined
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ 
              duration: 0.15, 
              ease: "easeOut",
            }}
            className={cn(
              "h-full",
              (activeTab === 'map' || activeTab === 'videos') ? "h-screen" : ""
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
