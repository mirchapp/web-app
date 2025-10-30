'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SideDrawer } from '@/components/ui/side-drawer';
import { cn } from '@/lib/utils';
import { ThumbsUp, Heart, Meh, ThumbsDown, User, Maximize2 } from 'lucide-react';
import { DishPhotoViewer } from './DishPhotoViewer';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price?: string | null;
  image?: string | null;
}

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: 'loved' | 'liked' | 'ok' | 'not-for-me';
  comment: string;
  image?: string;
  date: string;
}

interface MenuItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  restaurantName: string;
  restaurantLogo?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  zIndex?: number;
}

// Helper function to lighten a color
function lightenColor(color: string, percent: number): string {
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

  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));

  return `rgb(${r}, ${g}, ${b})`;
}

export function MenuItemDrawer({
  isOpen,
  onClose,
  item,
  restaurantName,
  restaurantLogo,
  primaryColor = '#8A42D6',
  secondaryColor,
  accentColor = '#A855F7',
  zIndex = 70,
}: MenuItemDrawerProps) {
  // Star positions for background animation
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

  const effectiveSecondaryColor = secondaryColor || lightenColor(primaryColor, 0.2);
  const readableTextColor = lightenColor(primaryColor, 0.4);
  const [showPhotoViewer, setShowPhotoViewer] = React.useState(false);
  const [initialPhotoIndex, setInitialPhotoIndex] = React.useState(0);

  // Generate mock dish photos for the photo viewer
  const dishPhotos = React.useMemo(() => {
    if (!item) return [];

    return [
    {
      id: '1',
      imageUrl: item.image || restaurantLogo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop',
      userName: 'Sarah Chen',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      caption: 'Absolutely incredible! The flavors were perfectly balanced and the presentation was stunning.',
      likes: 234,
      rating: 'loved' as const,
    },
    {
      id: '2',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop',
      userName: 'Michael Rodriguez',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      caption: 'Really good dish! A bit spicy for my taste but still enjoyed it.',
      likes: 189,
      rating: 'liked' as const,
    },
    {
      id: '3',
      imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=800&fit=crop',
      userName: 'Emma Thompson',
      userAvatar: 'https://i.pravatar.cc/150?img=5',
      caption: 'Best thing I\'ve had here! Will definitely order again.',
      likes: 312,
      rating: 'loved' as const,
    },
    {
      id: '4',
      imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=800&fit=crop',
      userName: 'James Park',
      userAvatar: 'https://i.pravatar.cc/150?img=8',
      caption: 'It was decent, nothing special. Expected more based on the reviews.',
      likes: 67,
      rating: 'ok' as const,
    },
  ];
  }, [item, restaurantLogo]);

  // Generate mock reviews
  const mockReviews: Review[] = React.useMemo(() => [
    {
      id: '1',
      userName: 'Sarah Chen',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      rating: 'loved',
      comment: 'Absolutely incredible! The flavors were perfectly balanced and the presentation was stunning.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
      date: '2 days ago'
    },
    {
      id: '2',
      userName: 'Michael Rodriguez',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      rating: 'liked',
      comment: 'Really good dish! A bit spicy for my taste but still enjoyed it.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
      date: '5 days ago'
    },
    {
      id: '3',
      userName: 'Emma Thompson',
      userAvatar: 'https://i.pravatar.cc/150?img=5',
      rating: 'loved',
      comment: 'Best thing I\'ve had here! Will definitely order again.',
      date: '1 week ago'
    },
    {
      id: '4',
      userName: 'James Park',
      userAvatar: 'https://i.pravatar.cc/150?img=8',
      rating: 'ok',
      comment: 'It was decent, nothing special. Expected more based on the reviews.',
      image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
      date: '2 weeks ago'
    }
  ], []);

  if (!item) return null;

  const displayImage = item.image || restaurantLogo;

  // Helper to get rating icon and color
  const getRatingDisplay = (rating: Review['rating']) => {
    switch (rating) {
      case 'loved':
        return {
          icon: Heart,
          text: 'Loved it',
          color: '#EF4444',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-400'
        };
      case 'liked':
        return {
          icon: ThumbsUp,
          text: 'Liked it',
          color: '#10B981',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-400'
        };
      case 'ok':
        return {
          icon: Meh,
          text: "It's ok",
          color: '#F59E0B',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-700 dark:text-amber-400'
        };
      case 'not-for-me':
        return {
          icon: ThumbsDown,
          text: 'Not for me',
          color: '#6B7280',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-700 dark:text-gray-400'
        };
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showBackButton={false}
      headerTopPadding="0"
      zIndex={zIndex}
    >
      {/* Full-bleed Image Header */}
      {displayImage && (
        <div
          className="relative h-80 w-full cursor-pointer group"
          onClick={() => {
            setInitialPhotoIndex(0);
            setShowPhotoViewer(true);
          }}
        >
          <Image
            src={displayImage}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 448px) 100vw, 448px"
            priority
          />
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

          {/* View Full Screen Hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div
              className="px-4 py-2 rounded-full backdrop-blur-md border border-white/40 flex items-center gap-2"
              style={{
                backgroundColor: `${primaryColor}90`,
              }}
            >
              <Maximize2 className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">View Photos</span>
            </div>
          </div>

          {/* Back Button Overlay */}
          <div
            className="absolute top-0 left-0 right-0 z-20 px-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
          </div>

          {/* Restaurant Name Badge */}
          <div className="absolute top-0 right-0 z-20 px-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
          >
            <div
              className="px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 text-white"
              style={{
                backgroundColor: `${primaryColor}90`,
              }}
            >
              <p className="text-xs font-medium tracking-wide uppercase">
                {restaurantName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 pb-8 max-w-md mx-auto relative z-10 -mt-8">
        {/* Item Name & Price Card */}
        <div
          className={cn(
            'p-6 rounded-[20px] mb-6',
            'bg-white dark:bg-[#0E0E13]',
            'border border-gray-200 dark:border-white/[0.08]',
            'shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
            'transition-all duration-200'
          )}
        >
          {/* Item Name & Price Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="text-[26px] font-light text-gray-900 dark:text-white tracking-tight leading-tight flex-1">
              {item.name}
            </h2>
            {item.price && (
              <span
                className="text-[22px] font-normal tracking-tight flex-shrink-0 mt-0.5"
                style={{ color: readableTextColor }}
              >
                {item.price}
              </span>
            )}
          </div>

          {/* Item Description */}
          {item.description && (
            <p className="text-[15px] text-gray-600 dark:text-white/[0.55] leading-[1.6] font-light">
              {item.description}
            </p>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-2">
          <h3 className="text-[17px] font-normal text-gray-900 dark:text-white mb-5 tracking-tight">
            Reviews
          </h3>
          <div className="space-y-3">
            {mockReviews.map((review, reviewIndex) => {
              const ratingDisplay = getRatingDisplay(review.rating);
              const RatingIcon = ratingDisplay.icon;

              // Find the photo index in dishPhotos array
              const photoIndex = dishPhotos.findIndex(photo => photo.id === review.id);

              return (
                <div
                  key={review.id}
                  className={cn(
                    'p-4 rounded-[18px]',
                    'bg-white dark:bg-[#0E0E13]',
                    'border border-gray-200 dark:border-white/[0.08]',
                    'shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]',
                    'transition-all duration-200'
                  )}
                >
                  {/* Review Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0 w-11 h-11 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-white/[0.12] shadow-sm">
                      {review.userAvatar ? (
                        <Image
                          src={review.userAvatar}
                          alt={review.userName}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5">
                          <User className="h-5 w-5 text-gray-400 dark:text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* User Info & Rating */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                        {review.userName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full', ratingDisplay.bgColor, ratingDisplay.textColor)}>
                          <RatingIcon className="h-3 w-3" fill="currentColor" />
                          {ratingDisplay.text}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-white/[0.45] font-normal">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Comment */}
                  <p className="text-[15px] text-gray-700 dark:text-white/[0.65] leading-[1.6] font-normal mb-3">
                    {review.comment}
                  </p>

                  {/* Review Image */}
                  {review.image && (
                    <div
                      className="relative h-[192px] w-full rounded-[16px] overflow-hidden ring-1 ring-gray-200 dark:ring-white/[0.08] cursor-pointer group"
                      onClick={() => {
                        if (photoIndex >= 0) {
                          setInitialPhotoIndex(photoIndex);
                          setShowPhotoViewer(true);
                        }
                      }}
                    >
                      <Image
                        src={review.image}
                        alt="Review photo"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 448px) 100vw, 448px"
                      />
                      {/* View hint on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                        <div
                          className="px-4 py-2 rounded-full backdrop-blur-md border border-white/30 flex items-center gap-2"
                          style={{
                            backgroundColor: `${primaryColor}90`,
                          }}
                        >
                          <Maximize2 className="h-4 w-4 text-white" />
                          <span className="text-white text-sm font-medium">View</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          <Button
            className="w-full h-[52px] rounded-[16px] font-medium text-[15px] transition-all duration-200 border-0 text-white shadow-lg"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 6px 24px ${primaryColor}40`,
            }}
            onClick={() => {
              // Add to order functionality could go here
              console.log('Add to order:', item);
            }}
          >
            Add to Order
          </Button>
          <Button
            variant="outline"
            className="w-full h-[52px] rounded-[16px] font-medium text-[15px] transition-all duration-200 border-gray-200 dark:border-white/[0.12]"
            style={{
              color: readableTextColor,
              backgroundColor: 'transparent',
            }}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Dish Photo Viewer - Full Screen */}
      <DishPhotoViewer
        isOpen={showPhotoViewer}
        onClose={() => setShowPhotoViewer(false)}
        dishName={item.name}
        photos={dishPhotos}
        restaurantName={restaurantName}
        primaryColor={primaryColor}
        initialIndex={initialPhotoIndex}
      />
    </SideDrawer>
  );
}
