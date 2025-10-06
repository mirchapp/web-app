'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, MapPin, Phone, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeArea } from '@/hooks/useSafeArea';
import type { Restaurant } from '@/types/video';

interface RestaurantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  restaurant: Restaurant;
}

export function RestaurantDrawer({ isOpen, onClose, onExpand, restaurant }: RestaurantDrawerProps) {
  const safeAreaInsets = useSafeArea();
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    // Begin closing animation and immediately allow touches to pass through backdrop
    setIsClosing(true);
    // Wait for the sheet animation to complete before unmounting
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm touch-manipulation"
          onClick={handleClose}
          style={{ willChange: 'opacity', pointerEvents: isClosing ? 'none' : 'auto' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isClosing ? '100%' : 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: isClosing ? 500 : 400,
              damping: isClosing ? 45 : 40,
              mass: isClosing ? 0.7 : 0.8,
              restDelta: 0.001,
              restSpeed: 0.001
            }}
            className="absolute bottom-0 left-0 right-0 bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              paddingBottom: `calc(5rem + ${Math.max(safeAreaInsets.bottom, 24)}px)`,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
            }}
          >

            {/* Restaurant Info */}
            <div className="px-6 pt-6 pb-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative h-16 w-16 rounded-[14px] overflow-hidden flex-shrink-0 bg-muted ring-2 ring-primary/10 dark:ring-primary/20 shadow-sm">
                  <Image
                    src={restaurant.logo || ''}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <h3 className="text-lg font-semibold text-foreground">
                      {restaurant.name}
                    </h3>
                    {restaurant.verified && (
                      <svg
                        className="h-4 w-4 text-blue-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground/80">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{restaurant.rating}</span>
                    <span className="text-xs">• Restaurant</span>
                  </div>
                </div>
              </div>

              {/* Distance & Address */}
              <div className="mb-5 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground/70 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{restaurant.distance} away</p>
                    <p className="text-muted-foreground/70 text-xs">{restaurant.address}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-11 bg-card/50 dark:bg-white/[0.02] hover:bg-accent dark:hover:bg-white/[0.05] border-border/30 dark:border-white/5 font-medium rounded-[14px] active:scale-95 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand();
                  }}
                >
                  <Maximize2 className="h-4 w-4 mr-1.5" />
                  View
                </Button>
                <Button
                  variant="outline"
                  className="h-11 bg-card/50 dark:bg-white/[0.02] hover:bg-accent dark:hover:bg-white/[0.05] border-border/30 dark:border-white/5 font-medium rounded-[14px] active:scale-95 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Open in map');
                  }}
                >
                  <MapPin className="h-4 w-4 mr-1.5" />
                  Map
                </Button>
                <Button
                  variant="outline"
                  className="h-11 bg-card/50 dark:bg-white/[0.02] hover:bg-accent dark:hover:bg-white/[0.05] border-border/30 dark:border-white/5 font-medium rounded-[14px] active:scale-95 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${restaurant.phone}`);
                  }}
                >
                  <Phone className="h-4 w-4 mr-1.5" />
                  Call
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
