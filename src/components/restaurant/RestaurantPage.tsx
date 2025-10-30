'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, MapPin, Phone, Search, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeArea } from '@/hooks/useSafeArea';
import { StreamingMenuSkeleton } from './StreamingMenuSkeleton';
import type { Restaurant } from '@/types/video';

interface RestaurantPageProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  isLoading?: boolean;
  loadingStatus?: {
    step: string;
    details?: string;
    currentStep: number;
    totalSteps: number;
  };
}

// Helper function to calculate luminance and determine if color is dark
function isColorDark(color: string): boolean {
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;

  // Handle different color formats
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    }
  }

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

// Helper function to lighten a color
function lightenColor(color: string, percent: number): string {
  // If color is already light enough, return it
  if (!isColorDark(color)) return color;

  // Convert to RGB and lighten
  let r = 0, g = 0, b = 0;

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0]);
      g = parseInt(matches[1]);
      b = parseInt(matches[2]);
    }
  }

  // Lighten by mixing with white
  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));

  return `rgb(${r}, ${g}, ${b})`;
}

export function RestaurantPage({ isOpen, onClose, restaurant, isLoading = false, loadingStatus }: RestaurantPageProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [hasTransparentBackground, setHasTransparentBackground] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const [isHorizontalDrag, setIsHorizontalDrag] = React.useState<boolean>(false);
  const touchStartX = React.useRef<number>(0);
  const touchStartY = React.useRef<number>(0);
  const touchCurrentX = React.useRef<number>(0);
  const touchCurrentY = React.useRef<number>(0);
  const isDraggingHorizontally = React.useRef<boolean | null>(null);
  const _safeAreaInsets = useSafeArea();

  const handleClose = () => {
    setDragOffset(0);
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    touchCurrentY.current = e.touches[0].clientY;
    isDraggingHorizontally.current = null;
    setIsHorizontalDrag(false);
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
      const isHorizontal = absY <= 3 && absX > absY;
      isDraggingHorizontally.current = isHorizontal;
      setIsHorizontalDrag(isHorizontal);
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
      // Allow normal scrolling
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
      handleClose();
    } else {
      // Snap back to position
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

  // Check if logo likely has transparent background
  // Since we can't use canvas due to CORS, we'll use file extension as a heuristic
  // PNG and SVG files typically have transparency, JPG/JPEG do not
  React.useEffect(() => {
    if (!restaurant.logo) {
      setHasTransparentBackground(false);
      return;
    }

    // Extract file extension from URL (handle query params)
    const url = restaurant.logo.toLowerCase();
    const urlWithoutParams = url.split('?')[0];

    // Check if it's a PNG or SVG (likely has transparency)
    const hasTransparency = urlWithoutParams.endsWith('.png') ||
                           urlWithoutParams.endsWith('.svg') ||
                           urlWithoutParams.includes('.png/') || // Some CDNs format like this
                           urlWithoutParams.includes('.svg/');

    console.log('Transparency assumed for:', restaurant.logo, '=', hasTransparency);
    setHasTransparentBackground(hasTransparency);
  }, [restaurant.logo]);

  // Extract colors from restaurant data, fallback to purple
  const primaryColor = restaurant.primaryColor || 'rgba(138, 66, 214, 0.4)';
  const accentColor = restaurant.accentColor || 'rgba(168, 85, 247, 0.3)';

  // Get readable text color (lighten if too dark)
  const readableTextColor = React.useMemo(() => {
    return lightenColor(primaryColor, 0.4);
  }, [primaryColor]);

  // Check if we have database categories/items
  const hasDbMenu = restaurant.fromDatabase && restaurant.categories && restaurant.categories.length > 0;

  // Check if description is long (more than 200 characters)
  const description = restaurant.description || restaurant.about || '';
  const isLongDescription = description.length > 200;

  // Filter menu items based on search and category
  const filteredCategories = React.useMemo(() => {
    if (!hasDbMenu || !restaurant.categories) return [];

    let categories = restaurant.categories;

    // Filter by selected category
    if (selectedCategory) {
      categories = categories.filter(cat => cat.id === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categories = categories
        .map(category => ({
          ...category,
          Menu_Item: category.Menu_Item.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
          )
        }))
        .filter(category => category.Menu_Item.length > 0);
    }

    return categories;
  }, [hasDbMenu, restaurant.categories, selectedCategory, searchQuery]);

  // Get unique categories for filter
  const menuCategories = React.useMemo(() => {
    if (!hasDbMenu || !restaurant.categories) return [];
    return restaurant.categories.map(cat => ({ id: cat.id, name: cat.name }));
  }, [hasDbMenu, restaurant.categories]);

  // Reset to 'All' category when menu loads or changes
  React.useEffect(() => {
    if (hasDbMenu && restaurant.categories) {
      setSelectedCategory(null); // null = "All" category
    }
  }, [hasDbMenu, restaurant.categories]);

  // Note: We don't modify body overflow here because VideoFeed already handles it
  // Modifying it here would interfere with VideoFeed's scroll prevention when closing

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          className="fixed z-50 bg-black/50 backdrop-blur-sm touch-manipulation"
          onClick={handleClose}
          style={{ 
            top: `calc(-1 * env(safe-area-inset-top))`,
            left: `calc(-1 * env(safe-area-inset-left))`,
            right: `calc(-1 * env(safe-area-inset-right))`,
            bottom: `calc(-1 * env(safe-area-inset-bottom))`,
            willChange: 'opacity', 
            pointerEvents: isClosing ? 'none' : 'auto' 
          }}
        >
          <motion.div
            ref={cardRef}
            initial={{ x: '100%' }}
            animate={{
              x: isClosing ? '100%' : (dragOffset > 0 ? dragOffset : 0),
              transition: {
                type: 'tween',
                duration: dragOffset > 0 ? 0 : (isClosing ? 0.6 : 0.5),
                ease: dragOffset > 0 ? 'linear' : [0.16, 1, 0.3, 1],
                delay: 0,
              }
            }}
            exit={{
              x: '100%',
              transition: { type: 'tween', duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
            className="absolute bottom-0 left-0 right-0 h-full w-full bg-white dark:bg-[#0A0A0F] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              touchAction: 'none',
            }}
          >
            {/* Restaurant Page Content */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto relative bg-white dark:bg-[#0A0A0F]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: isHorizontalDrag ? 'none' : 'pan-y',
                overflowY: isHorizontalDrag ? 'hidden' : 'auto',
              }}
            >
              {/* Back Button - Inside scroll container */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute z-30 top-6 left-4 h-8 w-8 rounded-full hover:bg-muted/50 bg-background/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </Button>
              {/* Animated wave background - uses restaurant colors */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Wave gradient with restaurant branding colors */}
                <div
                  className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
                  style={{
                    top: '10%',
                    background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 50%, ${primaryColor} 100%)`,
                    filter: 'blur(80px)',
                    transform: 'translateZ(0)',
                    animation: 'wave 8s ease-in-out infinite alternate'
                  }}
                />

                {/* Subtle stars/particles */}
                <div className="absolute inset-0 opacity-15 dark:opacity-30">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const top = Math.random() * 100;
                    const left = Math.random() * 100;
                    const duration = 2 + Math.random() * 3;
                    const delay = Math.random() * 2;
                    return (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          animation: `twinkle ${duration}s ease-in-out infinite`,
                          animationDelay: `${delay}s`,
                          willChange: 'opacity',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="container mx-auto px-4 pb-32 relative z-10" style={{ paddingTop: 'var(--overlay-card-top-padding-safe)' }}>
                <div className="max-w-md mx-auto">
                  <div
                    className="flex flex-col items-center justify-center animate-fade-in"
                    style={{
                      animation: 'fadeIn 0.6s ease-out'
                    }}
                  >
                    {/* Restaurant Logo with enhanced glow effect */}
                    <div className="relative mb-8 flex items-center justify-center">
                      {isLoading && !restaurant.logo ? (
                        <div className="h-32 w-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 animate-pulse rounded-2xl" />
                      ) : restaurant.logo ? (
                        <div
                          className={`relative h-32 w-64 rounded-2xl overflow-hidden ${!hasTransparentBackground ? 'ring-1 ring-gray-200 dark:ring-white/10' : ''}`}
                          style={{
                            ...(!hasTransparentBackground ? {
                              boxShadow: `0 10px 40px ${restaurant.primaryColor ? `${restaurant.primaryColor}30` : 'rgba(138,66,214,0.2)'}`,
                            } : {})
                          }}
                        >
                          <Image
                            src={restaurant.logo}
                            alt={restaurant.name}
                            fill
                            className="object-contain"
                            sizes="256px"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Restaurant Name with elegant typography */}
                    <div className="mb-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <h1 className="text-4xl font-light text-gray-900 dark:text-white tracking-tight">
                          {restaurant.name}
                        </h1>
                        {restaurant.verified && (
                          <svg
                            className="h-6 w-6 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Restaurant Bio with refined typography - from DB or default */}
                    {description && (
                      <div className="text-center mb-6 px-4 max-w-sm">
                        <p className={`text-sm sm:text-base leading-loose text-gray-600 dark:text-white/50 font-light ${!isDescriptionExpanded && isLongDescription ? 'line-clamp-3' : ''}`}>
                          {description}
                        </p>
                        {isLongDescription && (
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="text-xs mt-2 font-medium transition-colors hover:opacity-80"
                            style={{ color: readableTextColor }}
                          >
                            {isDescriptionExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Rating & Distance - Compact Row */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-base font-light text-gray-900 dark:text-white">{restaurant.rating}</span>
                      </div>
                      <span className="text-gray-400 dark:text-white/30">•</span>
                      <span className="text-sm text-gray-600 dark:text-white/50 font-light">Restaurant</span>
                      {restaurant.distance && (
                        <>
                          <span className="text-gray-400 dark:text-white/30">•</span>
                          <span className="text-sm text-gray-600 dark:text-white/50 font-light">{restaurant.distance}</span>
                        </>
                      )}
                    </div>

                    {/* Location - Simplified */}
                    <div className="flex items-center justify-center gap-1.5 mb-8 text-gray-600 dark:text-white/50">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-xs font-light">
                        {restaurant.address.split(',').slice(0, 2).join(',')}
                      </span>
                    </div>

                    {/* Action Buttons - uses restaurant brand colors */}
                    <div className="flex gap-3 w-full max-w-xs mb-6">
                      <Button
                        className="flex-1 h-11 rounded-[14px] font-light transition-all duration-200 border-0"
                        style={{
                          backgroundColor: restaurant.primaryColor || '#8A42D6',
                          color: 'white',
                          boxShadow: `0 4px 20px ${restaurant.primaryColor ? `${restaurant.primaryColor}55` : 'rgba(138,66,214,0.35)'}`,
                        }}
                        onClick={() => {
                          // Encode address for URL
                          const encodedAddress = encodeURIComponent(restaurant.address);

                          // Detect platform and open appropriate maps app
                          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                          const isAndroid = /Android/.test(navigator.userAgent);

                          if (isIOS) {
                            // iOS: Try Apple Maps first, fallback to Google Maps
                            window.open(`maps://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`);
                          } else if (isAndroid) {
                            // Android: Use Google Maps
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
                          } else {
                            // Desktop/Web: Open Google Maps in browser
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
                          }
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                      <Button
                        className="flex-1 h-11 rounded-[14px] font-light transition-all duration-200 backdrop-blur-md border-0"
                        style={{
                          color: readableTextColor,
                          backgroundColor: `${restaurant.primaryColor || '#8A42D6'}15`,
                          boxShadow: `inset 0 0 0 1px ${readableTextColor}60`,
                        }}
                        onClick={() => {
                          window.open(`tel:${restaurant.phone}`);
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>

                    {/* Loading Status - Below Action Buttons */}
                    {isLoading && loadingStatus && loadingStatus.step !== 'Loading...' && (
                      <div
                        className="w-full max-w-xs mb-10 p-4 rounded-2xl backdrop-blur-xl border shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}08, ${accentColor}08)`,
                          borderColor: `${primaryColor}25`,
                          boxShadow: `0 4px 20px ${primaryColor}15`
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <motion.div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: primaryColor }}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.6, 1, 0.6]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                            <span className="text-sm font-light text-gray-900 dark:text-white">
                              {loadingStatus.currentStep === 1 ? 'Finding menu' : 'Crafting menu'}
                            </span>
                          </div>
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: `${primaryColor}15`,
                              color: readableTextColor
                            }}
                          >
                            {loadingStatus.currentStep}/2
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          className="w-full h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: `${primaryColor}10` }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(loadingStatus.currentStep / 2) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* About Section */}
                    {restaurant.about && (
                      <div className="w-full mb-8">
                        <h3 className="text-base font-light text-gray-500 dark:text-foreground/60 mb-4 tracking-wide">About</h3>
                        <p className="text-sm text-gray-600 dark:text-white/50 leading-loose font-light">
                          {restaurant.about}
                        </p>
                      </div>
                    )}

                    {/* Hours Section */}
                    {restaurant.hours && (
                      <div className="w-full mb-8">
                        <h3 className="text-base font-light text-gray-500 dark:text-foreground/60 mb-4 tracking-wide">Hours</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/50 font-light">Monday - Friday</span>
                            <span className="text-gray-900 dark:text-white font-light">{restaurant.hours.weekday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/50 font-light">Saturday - Sunday</span>
                            <span className="text-gray-900 dark:text-white font-light">{restaurant.hours.weekend}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Popular Dishes */}
                    {restaurant.popularDishes && restaurant.popularDishes.length > 0 && (
                      <div className="w-full">
                        <h3 className="text-base font-light text-gray-500 dark:text-foreground/60 mb-5 tracking-wide">Popular Dishes</h3>
                        <div className="space-y-3">
                          {restaurant.popularDishes.map((dish, index) => (
                            <div key={index} className="flex gap-3 p-4 rounded-[14px] bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] hover:border-purple-200 dark:hover:border-purple-500/20 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(138,66,214,0.15),0_0_0_1px_rgba(138,66,214,0.1)] hover:-translate-y-0.5">
                              <div className="h-20 w-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-muted ring-1 ring-gray-200 dark:ring-black/5">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-light text-base text-gray-900 dark:text-white">{dish.name}</p>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-600 dark:text-white/50 font-light">4.{(7 + index * 2)}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-white/50 mb-2 line-clamp-2 font-light">{dish.description}</p>
                                
                                {/* Dish Labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                    Popular
                                  </span>
                                  {index === 0 && (
                                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                      Spicy
                                    </span>
                                  )}
                                  {index === 1 && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                      Vegetarian
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <p className="text-base font-light text-gray-900 dark:text-white">${dish.price.toFixed(2)}</p>
                                  <span className="text-xs text-gray-400 dark:text-white/35 font-light">{(23 + index * 5)} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Menu Section */}
                    <div className="w-full mt-6">
                      <h3 className="text-base font-light text-gray-500 dark:text-foreground/60 mb-6 tracking-wide">Full Menu</h3>

                      {/* Search and Filter - Only show when menu is loaded */}
                      {hasDbMenu && (
                        <div className="mb-6 space-y-3">
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/40" />
                            <input
                              type="text"
                              placeholder="Search dishes..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 transition-all"
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                              >
                                <X className="h-3.5 w-3.5 text-gray-400 dark:text-white/40" />
                              </button>
                            )}
                          </div>

                          {/* Category Pills */}
                          {menuCategories.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              <button
                                onClick={() => setSelectedCategory(null)}
                                className={`flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                                  !selectedCategory
                                    ? 'text-white'
                                    : 'text-gray-600 dark:text-white/60 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                                style={{
                                  ...((!selectedCategory) && {
                                    backgroundColor: primaryColor,
                                    boxShadow: `0 2px 8px ${primaryColor}40`
                                  })
                                }}
                              >
                                All
                              </button>
                              {menuCategories.map((category) => (
                                <button
                                  key={category.id}
                                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                                  className={`flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                                    selectedCategory === category.id
                                      ? 'text-white'
                                      : 'text-gray-600 dark:text-white/60 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                                  }`}
                                  style={{
                                    ...((selectedCategory === category.id) && {
                                      backgroundColor: primaryColor,
                                      boxShadow: `0 2px 8px ${primaryColor}40`
                                    })
                                  }}
                                >
                                  {category.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show streaming menu while loading OR when no DB menu */}
                      {(isLoading || !hasDbMenu) ? (
                        <StreamingMenuSkeleton
                          description={restaurant.streamingMenu?.description}
                          cuisine={restaurant.streamingMenu?.cuisine}
                          tags={restaurant.streamingMenu?.tags}
                          categories={restaurant.streamingMenu?.categories || []}
                          primaryColor={restaurant.primaryColor || '#8A42D6'}
                        />
                      ) : (
                        /* Render database categories if available */
                        <>
                          {filteredCategories.length === 0 ? (
                            <div className="text-center py-12">
                              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-white/20" />
                              <p className="text-sm text-gray-500 dark:text-white/50">No dishes found</p>
                              <button
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedCategory(null);
                                }}
                                className="mt-3 text-xs font-medium hover:underline"
                                style={{ color: readableTextColor }}
                              >
                                Clear filters
                              </button>
                            </div>
                          ) : (
                            filteredCategories
                              .filter(category => category.Menu_Item && category.Menu_Item.length > 0)
                              .map((category) => (
                            <div key={category.id} className="mb-8">
                              <h4 className="text-base font-light text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span
                                  className="h-1 w-8 rounded-full"
                                  style={{ backgroundColor: restaurant.primaryColor || '#8A42D6' }}
                                ></span>
                                {category.name}
                              </h4>
                              <div className="space-y-3">
                                {category.Menu_Item.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex gap-3 p-4 rounded-[14px] bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] hover:border-purple-200 dark:hover:border-purple-500/20 transition-all duration-200"
                                    style={{
                                      borderColor: restaurant.accentColor ? `${restaurant.accentColor}20` : undefined,
                                    }}
                                  >
                                    {/* If restaurant has a logo, use it as placeholder */}
                                    {restaurant.logo && (
                                      <div className="h-20 w-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-muted ring-1 ring-gray-200 dark:ring-black/5">
                                        <Image
                                          src={restaurant.logo}
                                          alt={item.name}
                                          width={80}
                                          height={80}
                                          className="object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-1">
                                        <p className="font-light text-base text-gray-900 dark:text-white">{item.name}</p>
                                        {item.price && (
                                          <p className="text-base font-light text-gray-900 dark:text-white ml-2">{item.price}</p>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-sm text-gray-600 dark:text-white/50 mb-2 line-clamp-2 font-light">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
