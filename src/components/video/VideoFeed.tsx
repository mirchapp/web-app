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
  const [isProfileClosing, setIsProfileClosing] = React.useState(false);
  const [followedUsers, setFollowedUsers] = React.useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = React.useState<Set<string>>(new Set());
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);
  const safeAreaInsets = useSafeArea();

  // Trigger initial animation
  React.useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Prevent background scrolling on Flix tab
  React.useEffect(() => {
    // Always prevent background scrolling when VideoFeed is mounted
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Reset dragOffset when profile card closes
  React.useEffect(() => {
    if (!showProfileCard) {
      setDragOffset(0);
    }
  }, [showProfileCard]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const profileCardRef = React.useRef<HTMLDivElement>(null);
  const profileScrollRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef<number>(0);
  const touchStartY = React.useRef<number>(0);
  const touchCurrentX = React.useRef<number>(0);
  const touchCurrentY = React.useRef<number>(0);
  const isDraggingHorizontally = React.useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const [isHorizontalDrag, setIsHorizontalDrag] = React.useState<boolean>(false);

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

  React.useEffect(() => {
    const button = profileCardRef.current;
    if (!button) return;

    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    button.addEventListener('dragstart', preventDrag);
    return () => {
      button.removeEventListener('dragstart', preventDrag);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    touchCurrentY.current = e.touches[0].clientY;
    isDraggingHorizontally.current = null; // Reset direction detection
    setIsHorizontalDrag(false); // Reset state
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Lock direction immediately on first movement
    if (isDraggingHorizontally.current === null && (absX > 3 || absY > 3)) {
      // If ANY vertical component exists, lock to vertical scrolling
      // Only allow horizontal if it's PURELY horizontal (absY <= 3px tolerance)
      const isHorizontal = absY <= 3 && absX > absY;
      isDraggingHorizontally.current = isHorizontal;
      setIsHorizontalDrag(isHorizontal); // Update state to trigger re-render
    }

    // Handle based on locked direction
    if (isDraggingHorizontally.current === true) {
      // Prevent scrolling when dragging card horizontally
      e.preventDefault();
      e.stopPropagation();

      if (diffX > 0) {
        setDragOffset(diffX);
      }
    } else if (isDraggingHorizontally.current === false) {
      // Allow normal scrolling - don't interfere
      setDragOffset(0);
    }

    touchCurrentX.current = currentX;
    touchCurrentY.current = currentY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();

    const swipeDistance = touchCurrentX.current - touchStartX.current;

    // Only close if it was a horizontal drag to the right (swipe right to close)
    if (isDraggingHorizontally.current === true && swipeDistance > 100) {
      // Controlled close to immediately allow touches to pass through backdrop
      handleProfileClose();
    } else {
      // Snap back to position with animation
      setDragOffset(0);
    }

    // Reset touch tracking
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchCurrentX.current = 0;
    touchCurrentY.current = 0;
    isDraggingHorizontally.current = null;
    setIsHorizontalDrag(false);
  };

  const handleProfileClose = () => {
    setIsProfileClosing(true);
    // Wait for slide-out before unmounting to free pointer events immediately
    setTimeout(() => {
      setIsProfileClosing(false);
      setShowProfileCard(false);
    }, 300);
  };

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
    <div className="fixed inset-0 bg-black">
      {/* Profile Card Overlay */}
      <AnimatePresence mode="wait" onExitComplete={() => setDragOffset(0)}>
        {showProfileCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 bg-transparent touch-manipulation"
            onClick={handleProfileClose}
            style={{ willChange: 'opacity', pointerEvents: isProfileClosing ? 'none' : 'auto' }}
          >
            <motion.div
              ref={profileCardRef}
              initial={{ x: '100%' }}
              animate={{
                x: isProfileClosing ? '100%' : (dragOffset > 0 ? dragOffset : 0),
                transition: dragOffset > 0
                  ? { type: 'tween', duration: 0, ease: 'linear' }
                  : { type: 'spring', stiffness: isProfileClosing ? 500 : 400, damping: isProfileClosing ? 45 : 40, mass: isProfileClosing ? 0.7 : 0.8, restDelta: 0.001, restSpeed: 0.001 }
              }}
              exit={{
                x: '100%',
                transition: { type: 'spring', stiffness: 500, damping: 45, mass: 0.7 }
              }}
              className="absolute right-0 top-0 h-full w-full max-w-md mx-auto bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              drag={false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0}
              style={{
                willChange: dragOffset !== 0 ? 'transform' : 'auto',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                y: 0,
                touchAction: 'none' // Disable all default touch behaviors on the card
              }}
            >
              {/* Profile Card Content */}
              <div
                ref={profileScrollRef}
                className="h-full overflow-y-auto relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  touchAction: isHorizontalDrag ? 'none' : 'pan-y'
                }}
              >
                {/* Back Button - Absolute Positioning */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleProfileClose}
                  className="absolute top-4 left-4 z-20 h-8 w-8 rounded-full hover:bg-muted/50 bg-background/80 backdrop-blur-sm"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>

                <div className="container mx-auto px-4 pt-12 pb-32">
                  <div className="max-w-md mx-auto">
                    <div className="flex flex-col items-center justify-center">
                      {/* Avatar */}
                      <div className="relative mb-6">
                        <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden ring-2 ring-primary/10 dark:ring-primary/20 shadow-sm">
                          <Image
                            src={videos[currentVideoIndex]?.user.avatar || ''}
                            alt={videos[currentVideoIndex]?.user.username || ''}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>

                      {/* Name */}
                      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
                        {videos[currentVideoIndex]?.user.username}
                      </h1>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 mb-6 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">Waterloo, ON</span>
                      </div>

                      {/* Stats with Dividers */}
                      <div className="flex items-center gap-8 mb-6 px-4">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-semibold text-foreground">12.5K</span>
                          <span className="text-xs text-muted-foreground">Followers</span>
                        </div>
                        <div className="h-10 w-px bg-border" />
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-semibold text-foreground">890</span>
                          <span className="text-xs text-muted-foreground">Following</span>
                        </div>
                        <div className="h-10 w-px bg-border" />
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-semibold text-foreground">234</span>
                          <span className="text-xs text-muted-foreground">Posts</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-base leading-relaxed text-muted-foreground text-center mb-6 px-4 max-w-xs">
                        Food enthusiast sharing my culinary adventures. Always on the hunt for the perfect dish and hidden gems in the city.
                      </p>

                      {/* Joined Date */}
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-6">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Joined September 2024</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 w-full max-w-xs mb-8">
                        <Button className="flex-1 h-11 rounded-xl font-medium" variant="default">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                        <Button className="flex-1 h-11 rounded-xl font-medium" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>

                      {/* Recent Posts Section */}
                      <div className="w-full">
                        <h2 className="text-lg font-semibold text-foreground mb-4 text-center">Recent Posts</h2>
                        <div className="columns-2 gap-2 space-y-2">
                          {[
                            { id: 'photo-1546069901-ba9599a7e63c', height: 200 }, // burger
                            { id: 'photo-1565299624946-b28f40a0ae38', height: 250 }, // pizza
                            { id: 'photo-1567620905732-2d1ec7ab7445', height: 180 }, // pancakes
                            { id: 'photo-1540189549336-e6e99c3679fe', height: 220 }, // salad
                            { id: 'photo-1565958011703-44f9829ba187', height: 190 }, // sushi
                            { id: 'photo-1551782450-a2132b4ba21d', height: 200 }, // pasta
                          ].map((item, i) => (
                            <div
                              key={i}
                              className="break-inside-avoid mb-2"
                            >
                              <div className="relative rounded-2xl bg-muted overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-200 ease-out cursor-pointer ring-1 ring-black/5 dark:ring-white/10">
                                <Image
                                  src={`https://images.unsplash.com/${item.id}?w=400&h=${item.height}&fit=crop`}
                                  alt={`Food ${i + 1}`}
                                  width={400}
                                  height={item.height}
                                  className="object-cover w-full"
                                  unoptimized
                                />
                              </div>
                            </div>
                          ))}
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
            className="absolute right-0 flex flex-col gap-6 pointer-events-auto"
            style={{
              bottom: `calc(5.25rem + ${Math.max(safeAreaInsets.bottom, 24)}px)`,
              paddingRight: '1.25rem',
            }}
            onTouchStartCapture={handleInteractiveTouchStart}
            onPointerDownCapture={handleInteractiveTouchStart}
          >
            <div className="flex flex-col items-center gap-1">
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
                className={cn(
                  "h-12 w-12 rounded-full backdrop-blur-xl transition-all duration-200 ease-in-out",
                  likedPosts.has(videos[currentVideoIndex].id)
                    ? "bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60"
                    : "bg-black/40 hover:bg-black/50",
                  "hover:scale-105 active:scale-95"
                )}
                style={{
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
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {videos[currentVideoIndex].stats.likes + (likedPosts.has(videos[currentVideoIndex].id) ? 1 : 0)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-12 w-12 rounded-full backdrop-blur-xl transition-all duration-200 ease-in-out",
                  "bg-black/40 hover:bg-black/50",
                  "hover:scale-105 active:scale-95"
                )}
                style={{
                  touchAction: 'manipulation',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <Bookmark className="h-5 w-5 text-white stroke-[1.5]" />
              </Button>
              <span
                className="text-xs font-medium text-white"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
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
            className="absolute left-0 right-0 px-5 pointer-events-auto"
            style={{
              bottom: `calc(5.25rem + ${Math.max(safeAreaInsets.bottom, 24)}px)`,
            }}
            onTouchStartCapture={handleInteractiveTouchStart}
            onPointerDownCapture={handleInteractiveTouchStart}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileCard(true);
                }}
                className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-white/50 flex-shrink-0 hover:ring-white/70 transition-all duration-200 cursor-pointer"
                style={{ touchAction: 'manipulation' }}
              >
                <Image
                  src={videos[currentVideoIndex].user.avatar}
                  alt={videos[currentVideoIndex].user.username}
                  fill
                  className="object-cover pointer-events-none"
                  unoptimized
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileCard(true);
                    }}
                    className="text-sm font-medium text-white hover:text-white/90 transition-colors duration-200 touch-manipulation tracking-wide"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)', touchAction: 'manipulation', letterSpacing: '0.02em' }}
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
                        className={cn(
                          "h-7 px-3 rounded-full backdrop-blur-xl text-xs font-medium transition-all duration-200",
                          isFollowing
                            ? "bg-primary/20 text-white border border-primary/40 hover:bg-primary/30 hover:border-primary/60"
                            : "bg-black/40 text-white border border-white/30 hover:bg-black/50 hover:border-white/40"
                        )}
                        style={{
                          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                          touchAction: 'manipulation',
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
                />

                <p className="text-xs text-white/70 font-light tracking-wide mt-1.5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)', letterSpacing: '0.01em' }}>
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
        className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar"
        style={{
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
