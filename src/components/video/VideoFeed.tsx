'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, Bookmark, Calendar, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSafeArea } from '@/hooks/useSafeArea';
import { RestaurantRow } from '@/components/restaurant/RestaurantRow';
import { RestaurantDrawer } from '@/components/restaurant/RestaurantDrawer';
import { RestaurantPage } from '@/components/restaurant/RestaurantPage';
import { ProfileDrawer } from '@/components/profile/ProfileDrawer';
import type { Video } from '@/types/video';

interface VideoFeedProps {
  videos: Video[];
  onVideoChange?: (index: number) => void;
}

export function VideoFeed({ videos, onVideoChange }: VideoFeedProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0);
  const [showProfileCard, setShowProfileCard] = React.useState(false);
  const [showMiniRestaurantSheet, setShowMiniRestaurantSheet] = React.useState(false);
  const [showRestaurantPage, setShowRestaurantPage] = React.useState(false);
  const [followedUsers, setFollowedUsers] = React.useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = React.useState<Set<string>>(new Set());
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);
  const safeAreaInsets = useSafeArea();
  const [isPWA, setIsPWA] = React.useState(false);

  // Detect if we're in PWA mode to adjust control positioning
  React.useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    setIsPWA(isStandalone);
  }, []);

  // Trigger initial animation
  React.useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Note: Body scroll locking is now handled by AppLayout
  // This component just renders full height content

  // Trigger navbar background detection when overlays open/close
  React.useEffect(() => {
    // Trigger multiple times during animation for smooth adaptation
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => window.dispatchEvent(new Event('scroll')), 50));
    timers.push(setTimeout(() => window.dispatchEvent(new Event('scroll')), 150));
    timers.push(setTimeout(() => window.dispatchEvent(new Event('scroll')), 350));
    return () => timers.forEach(clearTimeout);
  }, [showProfileCard, showMiniRestaurantSheet, showRestaurantPage]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Finalize snap position and cancel momentum so taps register immediately
  const finalizeSnapAndCancelMomentum = React.useCallback(() => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const currentTop = scroller.scrollTop;
    const itemHeight = scroller.clientHeight || 1;
    const targetIndex = Math.round(currentTop / itemHeight);
    const targetTop = targetIndex * itemHeight;

    // Disable snapping and momentum temporarily and lock overflow to stop kinetic scroll
    scroller.style.scrollSnapType = 'none';
    scroller.style.overflowY = 'hidden';
    scroller.style.setProperty('-webkit-overflow-scrolling', 'auto');

    // Jump to the nearest frame immediately
    scroller.scrollTo({ top: targetTop, left: 0, behavior: 'auto' });

    // Force reflow to apply the style changes synchronously
    void scroller.offsetHeight;

    // Restore scrolling and snapping shortly after so UX remains smooth
    scroller.style.overflowY = 'auto';
    setTimeout(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.style.setProperty('-webkit-overflow-scrolling', 'touch');
      el.style.scrollSnapType = 'y mandatory';
    }, 60);
  }, []);

  const handleInteractiveTouchStart = React.useCallback(() => {
    finalizeSnapAndCancelMomentum();
  }, [finalizeSnapAndCancelMomentum]);

  // Track scroll position to update current video
  React.useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTop = scrollContainerRef.current.scrollTop;
      const containerHeight = scrollContainerRef.current.clientHeight;
      const videoIndex = Math.round(scrollTop / containerHeight);

      if (videoIndex !== currentVideoIndex && videoIndex >= 0 && videoIndex < videos.length) {
        setCurrentVideoIndex(videoIndex);
        onVideoChange?.(videoIndex);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [currentVideoIndex, videos.length, onVideoChange]);

  const handleDoubleTap = React.useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected - like the post
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.add(videos[currentVideoIndex].id);
        return newSet;
      });

      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 400);
    }

    lastTapRef.current = now;
  }, [currentVideoIndex, videos]);


  return (
    <div 
      className="fixed bg-black" 
      style={{ 
        // With black-translucent, we need to compensate for the safe area padding on html
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
      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={showProfileCard}
        onClose={() => setShowProfileCard(false)}
        userId={videos[currentVideoIndex]?.user.id}
      />

      <RestaurantDrawer
        isOpen={showMiniRestaurantSheet}
        onClose={() => setShowMiniRestaurantSheet(false)}
        onExpand={() => {
          setShowMiniRestaurantSheet(false);
          setShowRestaurantPage(true);
        }}
        restaurant={videos[currentVideoIndex]?.restaurant}
      />

      <RestaurantPage
        isOpen={showRestaurantPage}
        onClose={() => setShowRestaurantPage(false)}
        restaurant={videos[currentVideoIndex]?.restaurant}
      />

      {/* Heart Animation Overlay */}
      <AnimatePresence>
        {showHeartAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-32 h-32 text-white fill-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay Controls (outside scroll container to avoid tap delays during momentum) */}
      {videos[currentVideoIndex] && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Action Buttons - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: hasAnimated ? 1 : 0, x: hasAnimated ? 0 : 20 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            className="absolute right-0 flex flex-col gap-6"
            style={{
              bottom: `calc(${isPWA ? '7rem' : '4rem'} + ${Math.max(safeAreaInsets.bottom, 24)}px)`,
              paddingRight: '1.25rem',
            }}
          >
            <div className="flex flex-col items-center gap-1" style={{ pointerEvents: 'none' }}>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setLikedPosts(prev => {
                    const newSet = new Set(prev);
                    const isLiked = likedPosts.has(videos[currentVideoIndex].id);
                    if (isLiked) {
                      newSet.delete(videos[currentVideoIndex].id);
                    } else {
                      newSet.add(videos[currentVideoIndex].id);
                    }
                    return newSet;
                  });
                }}
                onTouchStart={handleInteractiveTouchStart}
                onPointerDown={handleInteractiveTouchStart}
                className={cn(
                  "h-12 w-12 rounded-full backdrop-blur-xl transition-all duration-200 ease-in-out",
                  likedPosts.has(videos[currentVideoIndex].id)
                    ? "bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60"
                    : "bg-black/40 hover:bg-black/50",
                  "hover:scale-105 active:scale-95"
                )}
                style={{
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  boxShadow: likedPosts.has(videos[currentVideoIndex].id)
                    ? '0 0 12px rgba(138, 66, 214, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {likedPosts.has(videos[currentVideoIndex].id) ? (
                  <Heart className="h-5 w-5 text-white fill-white" />
                ) : (
                  <Heart className="h-5 w-5 text-white stroke-[1.5]" />
                )}
              </Button>
              <span
                className="text-xs font-medium text-white"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
              >
                {videos[currentVideoIndex].stats.likes + (likedPosts.has(videos[currentVideoIndex].id) ? 1 : 0)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1" style={{ pointerEvents: 'none' }}>
              <Button
                size="icon"
                variant="ghost"
                onTouchStart={handleInteractiveTouchStart}
                onPointerDown={handleInteractiveTouchStart}
                className={cn(
                  "h-12 w-12 rounded-full backdrop-blur-xl transition-all duration-200 ease-in-out",
                  "bg-black/40 hover:bg-black/50",
                  "hover:scale-105 active:scale-95"
                )}
                style={{
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <Bookmark className="h-5 w-5 text-white stroke-[1.5]" />
              </Button>
              <span
                className="text-xs font-medium text-white"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
              >
                Save
              </span>
            </div>
          </motion.div>

          {/* Creator Info - Bottom Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hasAnimated ? 1 : 0, y: hasAnimated ? 0 : 20 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
            className="absolute left-0 right-0 px-5"
            style={{
              bottom: `calc(${isPWA ? '7rem' : '4rem'} + ${Math.max(safeAreaInsets.bottom, 24)}px)`,
            }}
          >
            <div className="flex items-start gap-3" style={{ pointerEvents: 'none' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileCard(true);
                }}
                onTouchStart={handleInteractiveTouchStart}
                onPointerDown={handleInteractiveTouchStart}
                className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-white/50 flex-shrink-0 hover:ring-white/70 transition-all duration-200 cursor-pointer"
                style={{ touchAction: 'manipulation', pointerEvents: 'auto' }}
              >
                <Image
                  src={videos[currentVideoIndex].user.avatar}
                  alt={videos[currentVideoIndex].user.username}
                  fill
                  className="object-cover pointer-events-none"
                  unoptimized
                />
              </button>
              <div className="flex-1 min-w-0" style={{ pointerEvents: 'none' }}>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileCard(true);
                    }}
                    onTouchStart={handleInteractiveTouchStart}
                    onPointerDown={handleInteractiveTouchStart}
                    className="text-sm font-medium text-white hover:text-white/90 transition-colors duration-200 touch-manipulation tracking-wide"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)', touchAction: 'manipulation', letterSpacing: '0.02em', pointerEvents: 'auto' }}
                  >
                    {videos[currentVideoIndex].user.username}
                  </button>
                  {(() => {
                    const isFollowing = followedUsers.has(videos[currentVideoIndex].user.username);
                    return (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();

                          setFollowedUsers(prev => {
                            const newSet = new Set(prev);
                            if (isFollowing) {
                              newSet.delete(videos[currentVideoIndex].user.username);
                            } else {
                              newSet.add(videos[currentVideoIndex].user.username);
                            }
                            return newSet;
                          });
                        }}
                        onTouchStart={handleInteractiveTouchStart}
                        onPointerDown={handleInteractiveTouchStart}
                        className={cn(
                          "h-7 px-3 rounded-full backdrop-blur-xl text-xs font-medium transition-all duration-200",
                          isFollowing
                            ? "bg-primary/20 text-white border border-primary/40 hover:bg-primary/30 hover:border-primary/60"
                            : "bg-black/40 text-white border border-white/30 hover:bg-black/50 hover:border-white/40"
                        )}
                        style={{
                          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                          touchAction: 'manipulation',
                          pointerEvents: 'auto',
                          boxShadow: isFollowing
                            ? '0 0 12px rgba(138, 66, 214, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            : '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    );
                  })()}
                </div>

                <RestaurantRow
                  restaurantLogo={videos[currentVideoIndex].restaurant.logo}
                  restaurantName={videos[currentVideoIndex].restaurant.name}
                  verified={videos[currentVideoIndex].restaurant.verified}
                  onClick={() => setShowMiniRestaurantSheet(true)}
                  onTouchStartCapture={handleInteractiveTouchStart}
                />

                <p className="text-xs text-white/70 font-light tracking-wide mt-1.5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)', letterSpacing: '0.01em', pointerEvents: 'none' }}>
                  {videos[currentVideoIndex].dish}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto snap-y snap-mandatory hide-scrollbar"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'auto',
          overscrollBehavior: 'contain',
          pointerEvents: 'auto',
          touchAction: 'pan-y',
        }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="relative w-full h-full snap-start snap-always"
            style={{ pointerEvents: 'auto' }}
            onClick={handleDoubleTap}
          >
            <Image
              src={video.src}
              alt={video.dish}
              fill
              className="object-cover"
              unoptimized
              priority={index === 0}
            />
            {/* Soft gradient overlay from bottom for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
