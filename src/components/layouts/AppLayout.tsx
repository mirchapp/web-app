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
  const [showProfileCard, setShowProfileCard] = React.useState(false);
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
      {/* Profile Card Overlay */}
      <AnimatePresence>
        {showProfileCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowProfileCard(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-md mx-auto bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Card Content */}
              <div className="h-full overflow-y-auto">
                {/* Back Button */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/20 p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowProfileCard(false)}
                    className="h-8 w-8 rounded-full hover:bg-muted/50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                </div>
                
                <div 
                  className="container mx-auto px-4 pt-2"
                  style={{
                    paddingBottom: 'calc(7rem + var(--safe-area-inset-bottom))',
                  }}
                >
                  <div className="max-w-md mx-auto">
                    <div className="flex flex-col items-center justify-center">
                      {/* Avatar */}
                      <div className="relative mb-6">
                        <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden ring-2 ring-primary/10 dark:ring-primary/20 shadow-sm">
                          <Image
                            src="/faizaan.jpeg"
                            alt="Faizaan Qureshi"
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 640px) 128px, 160px"
                            unoptimized
                          />
                        </div>
                      </div>
                      
                      {/* Name */}
                      <div className="mb-3">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                          Faizaan Qureshi
                        </h1>
                      </div>
                      
                      {/* Location */}
                      <div className="flex items-center gap-1.5 mb-6 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">Waterloo, ON</span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-8 mb-6 px-4">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-semibold text-foreground">2.4k</span>
                          <span className="text-xs text-muted-foreground">Followers</span>
                        </div>
                        <div className="h-10 w-px bg-border" />
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-semibold text-foreground">156</span>
                          <span className="text-xs text-muted-foreground">Following</span>
                        </div>
                        <div className="h-10 w-px bg-border" />
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-semibold text-foreground">89</span>
                          <span className="text-xs text-muted-foreground">Posts</span>
                        </div>
                      </div>
                      
                      {/* Bio */}
                      <p className="text-center text-base leading-relaxed text-muted-foreground mb-6 px-4">
                        Food enthusiast and content creator sharing delicious recipes and restaurant experiences. 
                        Passionate about discovering new flavors and bringing culinary adventures to life.
                      </p>
                      
                      {/* Joined Date */}
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-8">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Joined September 2024</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 w-full max-w-xs mb-8">
                        <Button 
                          className="flex-1 h-11 bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 ease-out rounded-2xl font-medium text-sm"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 h-11 bg-background/80 hover:bg-background backdrop-blur-sm border border-border/30 hover:border-border/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out rounded-2xl font-medium text-sm"
                        >
                          Message
                        </Button>
                      </div>

                      {/* Recent Posts Preview */}
                      <div className="w-full">
                        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Recent Posts</h3>
                        <div className="space-y-3">
                          <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop"
                                alt="Thai Basil Beef"
                                width={48}
                                height={48}
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">Thai Basil Beef with Cashews</p>
                              <p className="text-xs text-muted-foreground">The Spice House</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">2.4k likes</span>
                                <span className="text-xs text-muted-foreground">2h ago</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
                            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop"
                                alt="Pizza"
                                width={48}
                                height={48}
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">Hand-tossed Margherita Pizza</p>
                              <p className="text-xs text-muted-foreground">Pizza Corner</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">1.8k likes</span>
                                <span className="text-xs text-muted-foreground">5h ago</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Container */}
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* First Video/Image */}
        <div className="relative w-full h-screen snap-start">
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
                  <button 
                    onClick={() => setShowProfileCard(true)}
                    className="text-sm font-semibold text-white hover:text-white/80 transition-colors duration-200"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                  >
                  Faizaan Qureshi
                  </button>
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

        {/* Second Video/Image */}
        <div className="relative w-full h-screen snap-start bg-gradient-to-br from-orange-400 to-red-500">
          <Image
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1080&h=1920&fit=crop"
            alt="Pizza making process"
            fill
            className="object-cover"
            unoptimized
          />
          
          {/* Action Buttons - Right Side */}
          <div className="absolute right-4 flex flex-col items-center gap-6 z-10 transition-colors duration-300"
            style={{
              bottom: 'calc(8rem + var(--safe-area-inset-bottom))',
            }}
          >
            {/* Like Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/40 transition-all duration-300"
              >
                <Heart className="h-6 w-6 text-white transition-colors duration-300" />
              </Button>
              <span 
                className="text-xs font-semibold text-white transition-colors duration-300"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                1.8k
              </span>
            </div>
            
            {/* Save Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/40 transition-all duration-300"
              >
                <Bookmark className="h-6 w-6 text-white transition-colors duration-300" />
              </Button>
              <span 
                className="text-xs font-semibold text-white transition-colors duration-300"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
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
                  <button 
                    onClick={() => setShowProfileCard(true)}
                    className="text-sm font-semibold text-white hover:text-white/80 transition-colors duration-200"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                  >
                    Faizaan Qureshi
                  </button>
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
                    Pizza Corner
                  </p>
                  <p className="text-xs text-white/75" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                    Hand-tossed Margherita Pizza
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Video/Image */}
        <div className="relative w-full h-screen snap-start">
          <Image
            src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1080&h=1920&fit=crop"
            alt="Burger preparation"
            fill
            className="object-cover"
            unoptimized
          />
          
          {/* Action Buttons - Right Side */}
          <div className="absolute right-4 flex flex-col items-center gap-6 z-10 transition-colors duration-300"
            style={{
              bottom: 'calc(8rem + var(--safe-area-inset-bottom))',
            }}
          >
            {/* Like Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/40 transition-all duration-300"
              >
                <Heart className="h-6 w-6 text-white transition-colors duration-300" />
              </Button>
              <span 
                className="text-xs font-semibold text-white transition-colors duration-300"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                3.2k
              </span>
            </div>
            
            {/* Save Button */}
            <div className="flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/40 transition-all duration-300"
              >
                <Bookmark className="h-6 w-6 text-white transition-colors duration-300" />
              </Button>
              <span 
                className="text-xs font-semibold text-white transition-colors duration-300"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
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
                  <button 
                    onClick={() => setShowProfileCard(true)}
                    className="text-sm font-semibold text-white hover:text-white/80 transition-colors duration-200"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                  >
                    Faizaan Qureshi
                  </button>
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
                    Burger Palace
                  </p>
                  <p className="text-xs text-white/75" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                    Gourmet Beef Burger with Fries
                  </p>
                </div>
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
