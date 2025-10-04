'use client';

import * as React from 'react';
import { useSafeArea } from '@/hooks/useSafeArea';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantMenuPage } from '@/components/restaurant/RestaurantMenuPage';
import { NewPostRatings } from '@/components/ratings/NewPostRatings';
import type { TasteValue } from '@/components/ratings/ReactionBar';
import type { ValueForMoneyValue } from '@/components/ratings/FlavorDetailsCard';

interface PostEditorProps {
  restaurantName: string;
  restaurantId: string;
  restaurantAddress?: string;
  restaurantPhoto?: string;
  restaurantRating?: number;
  mediaData: string;
  isVideo: boolean;
  onBack: () => void;
  onPublish: (data: { caption: string; rating: TasteValue; valueForMoney?: ValueForMoneyValue; wouldOrderAgain?: boolean; menuItemId?: string; menuItemName?: string }) => void;
}

// Legacy types removed; using TasteValue/ValueForMoneyValue from rating components

export function PostEditor({
  restaurantName,
  restaurantId,
  restaurantAddress,
  restaurantPhoto,
  restaurantRating,
  mediaData,
  isVideo,
  onBack,
  onPublish,
}: PostEditorProps) {
  const safeAreaInsets = useSafeArea();
  const [caption, setCaption] = React.useState('');
  const [rating, setRating] = React.useState<TasteValue | null>(null);
  const [valueForMoney, setValueForMoney] = React.useState<ValueForMoneyValue | null>(null);
  const [wouldOrderAgain, setWouldOrderAgain] = React.useState<boolean | null>(null);
  // Removed showMore/tags; using compact ratings component
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);
  const captionRef = React.useRef<HTMLTextAreaElement>(null);
  const maxCaptionLength = 2200;

  const normalizedBottomInset = Math.min(safeAreaInsets.bottom, 44);

  // Detect virtual keyboard via VisualViewport where available
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('visualViewport' in window)) return;
    const vv = window.visualViewport as VisualViewport | null;
    if (!vv) return;

    const handleViewportChange = () => {
      const heightDelta = window.innerHeight - vv.height;
      // Consider keyboard open if delta is significant (~>100px)
      setIsKeyboardOpen(heightDelta > 100);

      // Keep input visible by scrolling inner container instead of layout viewport
      if (heightDelta > 100 && captionRef.current) {
        const scroller = document.getElementById('post-editor-scroll');
        if (scroller) {
          const rect = captionRef.current.getBoundingClientRect();
          const scrollerRect = scroller.getBoundingClientRect();
          // If the input is below the visible area, scroll it into view within the scroller
          if (rect.bottom > scrollerRect.bottom - 16) {
            const offset = rect.bottom - scrollerRect.bottom + scroller.scrollTop + 16;
            scroller.scrollTo({ top: offset, behavior: 'smooth' });
          }
        }
        // Prevent the overall page from shifting
        window.scrollTo(0, 0);
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    handleViewportChange();
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Menu selector state
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = React.useState<{ id: string; name: string } | null>(null);
  const [showMediaPreview, setShowMediaPreview] = React.useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col min-h-0 overflow-hidden touch-none">
      {/* Header */}
      <div
        className="bg-background px-4 pt-1 pb-3 border-b border-border/50 flex-shrink-0 select-none"
        style={{ paddingTop: `${safeAreaInsets.top}px` }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-12 w-12 rounded-full -ml-2"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
            New Post
          </h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Content (scrolls between header and footer) */}
      <div
        id="post-editor-scroll"
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', paddingBottom: isKeyboardOpen ? '12px' : undefined }}
      >
        {/* Media Preview */}
        <div className="relative w-full aspect-square md:aspect-[9/16] rounded-3xl overflow-hidden bg-muted shadow-lg ring-1 ring-black/5 mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMediaPreview(true)}
            className="absolute top-3 left-3 z-10 h-8 rounded-full px-3 bg-black/40 hover:bg-black/55 text-white backdrop-blur-sm"
            aria-label="Preview media"
          >
            Preview
          </Button>
          {isVideo ? (
            <video
              src={mediaData}
              controls
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={mediaData}
              alt="Post preview"
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        <div role="separator" aria-orientation="horizontal" className="my-4 h-px bg-border/50" />

        {/* Caption Input */}
        <div className="mb-4">
          <textarea
            ref={captionRef}
            value={caption}
            onChange={(e) => {
              if (e.target.value.length <= maxCaptionLength) {
                setCaption(e.target.value);
              }
            }}
            onFocus={() => setIsKeyboardOpen(true)}
            onBlur={() => setIsKeyboardOpen(false)}
            onTouchStart={(e) => {
              // Prevent iOS from scrolling layout viewport when focusing
              e.preventDefault();
              const el = captionRef.current;
              if (el) {
                try {
                  // focus({ preventScroll }) is supported in modern browsers
                  (el as HTMLTextAreaElement & { focus: (options?: FocusOptions) => void }).focus({ preventScroll: true });
                } catch {
                  el.focus();
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                }
                const len = el.value.length;
                try { el.setSelectionRange(len, len); } catch {}
              }
            }}
            placeholder="Add a caption..."
            maxLength={maxCaptionLength}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground placeholder:text-muted-foreground resize-none transition-all"
          />
        </div>

        <div role="separator" aria-orientation="horizontal" className="my-4 h-px bg-border/50" />

        {/* Restaurant Info */}
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 mb-4 active:scale-[0.995] transition-transform"
          role="button"
          tabIndex={0}
          onClick={() => setIsMenuOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsMenuOpen(true); } }}
        >
          <div className="flex items-center gap-3">
            {/* Restaurant Image */}
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {restaurantPhoto ? (
                <Image
                  src={restaurantPhoto}
                  alt={restaurantName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl">{restaurantName.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Restaurant Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {restaurantName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {restaurantAddress || 'Restaurant'}
              </p>
              {restaurantRating && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ⭐ {restaurantRating}
                </p>
              )}
            </div>
          </div>

          {/* Inline CTA */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="w-full flex items-center justify-between text-sm font-medium">
              <span>{selectedMenuItem ? selectedMenuItem.name : 'Select Dish or Item'}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div role="separator" aria-orientation="horizontal" className="my-4 h-px bg-border/50" />

        {/* Rating Selector */}
        <div className="mb-4">
          <NewPostRatings
            taste={rating}
            valueForMoney={valueForMoney}
            wouldOrderAgain={wouldOrderAgain}
            onChangeTaste={setRating}
            onChangeValueForMoney={setValueForMoney}
            onChangeWouldOrderAgain={setWouldOrderAgain}
          />
        </div>

        
      </div>

      {/* Fullscreen Restaurant Menu (no extra info, only menu) */}
      <RestaurantMenuPage
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onConfirm={(item) => { setSelectedMenuItem(item); setIsMenuOpen(false); }}
        restaurantName={restaurantName}
      />

      {/* Media Preview Overlay with Flix-style overlay */}
      <AnimatePresence>
        {showMediaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] bg-black"
            onClick={() => setShowMediaPreview(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setShowMediaPreview(false); }}
              className="absolute left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white z-30 pointer-events-auto"
              style={{ top: `${Math.max(safeAreaInsets.top + 8, 16)}px` }}
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="absolute inset-0" style={{ zIndex: 10 }}>
              {isVideo ? (
                <video
                  src={mediaData}
                  controls
                  playsInline
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
                  <Image src={mediaData} alt="Media preview" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>

            {/* Flix-style overlay controls */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Action Buttons - Right Side */}
              <div
                className="absolute right-0 flex flex-col gap-6 pointer-events-auto"
                style={{
                  bottom: `calc(${Math.max(safeAreaInsets.bottom, 24)}px + 1.25rem)`,
                  paddingRight: '1.25rem',
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    className="h-12 w-12 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/40"
                  >
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </Button>
                  <span className="text-xs font-semibold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    123
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    className="h-12 w-12 rounded-full backdrop-blur-sm bg-black/30 hover:bg-black/40"
                  >
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </Button>
                  <span className="text-xs font-semibold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    Save
                  </span>
                </div>
              </div>

              {/* Creator Info - Bottom Overlay */}
              <div
                className="absolute left-0 right-0 px-5 pointer-events-auto"
                style={{
                  bottom: `calc(${Math.max(safeAreaInsets.bottom, 24)}px + 1.25rem)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-white/50 flex-shrink-0">
                    <Image
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                      alt="User"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        @yourusername
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 px-3 rounded-full border border-white/60 bg-transparent text-white hover:bg-white/20 hover:text-white hover:border-white text-xs font-medium"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                      >
                        Follow
                      </Button>
                    </div>

                    {/* Restaurant info */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative h-5 w-5 rounded-full overflow-hidden bg-white">
                        {restaurantPhoto ? (
                          <Image
                            src={restaurantPhoto}
                            alt={restaurantName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-xs">{restaurantName.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        {restaurantName}
                      </span>
                      {restaurantRating && (
                        <span className="text-xs text-white/90" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                          ⭐ {restaurantRating}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/60" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                      {selectedMenuItem ? selectedMenuItem.name : 'Delicious Dish'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Action Buttons */}
      <div
        className="border-t border-border/50 px-4 pt-3 bg-background flex gap-3 flex-shrink-0"
        style={{ paddingBottom: `${isKeyboardOpen ? 0 : normalizedBottomInset}px` }}
      >
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-2xl text-base font-semibold"
        >
          Save Draft
        </Button>
        <Button
          onClick={() => rating && onPublish({ caption, rating, valueForMoney: valueForMoney ?? undefined, wouldOrderAgain: wouldOrderAgain ?? undefined, menuItemId: selectedMenuItem?.id, menuItemName: selectedMenuItem?.name })}
          disabled={!rating}
          className="flex-1 h-12 rounded-2xl text-base font-semibold"
        >
          Share
        </Button>
      </div>
    </div>
  );
}
