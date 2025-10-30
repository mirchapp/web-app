'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeArea } from '@/hooks/useSafeArea';

interface DishPhoto {
  id: string;
  imageUrl: string;
  userName: string;
  userAvatar?: string;
  caption?: string;
  likes: number;
  rating: 'loved' | 'liked' | 'ok' | 'not-for-me';
}

interface DishPhotoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  dishName: string;
  photos: DishPhoto[];
  restaurantName: string;
  primaryColor?: string;
  initialIndex?: number;
}

export function DishPhotoViewer({
  isOpen,
  onClose,
  dishName,
  photos,
  restaurantName,
  primaryColor = '#8A42D6',
  initialIndex = 0,
}: DishPhotoViewerProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(initialIndex);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const safeAreaInsets = useSafeArea();
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);

  // Scroll to initial index when opening
  React.useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const containerHeight = scrollContainerRef.current.clientHeight;
      const targetScroll = initialIndex * containerHeight;
      scrollContainerRef.current.scrollTo({
        top: targetScroll,
        behavior: 'auto',
      });
      setCurrentPhotoIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Track scroll position to update current photo
  React.useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTop = scrollContainerRef.current.scrollTop;
      const containerHeight = scrollContainerRef.current.clientHeight;
      const photoIndex = Math.round(scrollTop / containerHeight);

      if (photoIndex !== currentPhotoIndex && photoIndex >= 0 && photoIndex < photos.length) {
        setCurrentPhotoIndex(photoIndex);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [currentPhotoIndex, photos.length]);

  // Handle double tap to like
  const handleDoubleTap = React.useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }

    lastTapRef.current = now;
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bg-black z-[100]"
          style={{
            top: `calc(-1 * env(safe-area-inset-top))`,
            left: `calc(-1 * env(safe-area-inset-left))`,
            right: `calc(-1 * env(safe-area-inset-right))`,
            bottom: `calc(-1 * env(safe-area-inset-bottom))`,
            paddingTop: `env(safe-area-inset-top)`,
            paddingLeft: `env(safe-area-inset-left)`,
            paddingRight: `env(safe-area-inset-right)`,
            paddingBottom: `env(safe-area-inset-bottom)`,
          }}
        >
          {/* Close Button */}
          <div
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
            style={{
              paddingTop: `calc(env(safe-area-inset-top, 0px) + 1rem)`,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
              pointerEvents: 'auto',
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Photo Counter */}
            <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </div>

          {/* Scrollable Photo Feed */}
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto"
            style={{
              scrollSnapType: 'y mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative h-full w-full flex-shrink-0"
                style={{
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                }}
                onClick={handleDoubleTap}
              >
                {/* Photo */}
                <div className="relative h-full w-full">
                  <Image
                    src={photo.imageUrl}
                    alt={`${dishName} photo ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority={index === 0}
                  />
                </div>

                {/* Double-tap heart animation */}
                <AnimatePresence>
                  {showHeartAnimation && index === currentPhotoIndex && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart
                        className="w-32 h-32"
                        fill="#EF4444"
                        stroke="white"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Info Overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-5"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    paddingBottom: `calc(1.25rem + ${safeAreaInsets.bottom}px)`,
                  }}
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
                      {photo.userAvatar ? (
                        <Image
                          src={photo.userAvatar}
                          alt={photo.userName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          <User className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{photo.userName}</p>
                      <p className="text-white/60 text-xs">{restaurantName}</p>
                    </div>
                  </div>

                  {/* Dish Name */}
                  <h3 className="text-white text-lg font-medium mb-2">{dishName}</h3>

                  {/* Caption */}
                  {photo.caption && (
                    <p className="text-white/80 text-sm leading-relaxed mb-3">
                      {photo.caption}
                    </p>
                  )}

                  {/* Rating Badge */}
                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${primaryColor}90`,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Heart className="h-3.5 w-3.5 text-white" fill="white" />
                      <span className="text-white text-xs font-medium">
                        {photo.likes} likes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
