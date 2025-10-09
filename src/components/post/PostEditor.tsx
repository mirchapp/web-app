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

  // Memoize star positions so they don't change on re-render (matching ProfileOverview)
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

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
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0A0A0F] flex flex-col min-h-0">
      {/* Animated purple wave background - matching profile page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Purple wave gradient */}
        <div
          className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
          style={{
            top: '10%',
            background: 'linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)',
            filter: 'blur(80px)',
            transform: 'translateZ(0)',
            animation: 'wave 8s ease-in-out infinite alternate'
          }}
        />

        {/* Subtle stars/particles */}
        <div className="absolute inset-0 opacity-15 dark:opacity-30">
          {starPositions.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 dark:bg-white/20 rounded-full"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                willChange: 'opacity',
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div
        className="bg-white/80 dark:bg-[#0A0A0F]/80 backdrop-blur-sm px-5 pt-1 pb-5 border-b border-gray-200 dark:border-white/5 flex-shrink-0 select-none relative z-10"
        style={{ paddingTop: 'var(--post-screen-top-padding-safe)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full -ml-2 hover:bg-muted/50"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <h1 className="flex-1 text-center text-3xl font-light bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
            Create Post
          </h1>
          <div className="w-9" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 dark:text-muted-foreground/80 font-light leading-relaxed">Step 3 of 3 — Add details and share</p>
        </motion.div>
      </div>

      {/* Content (scrolls between header and footer) */}
      <div
        id="post-editor-scroll"
        className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 relative z-10"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y', paddingBottom: isKeyboardOpen ? '12px' : undefined }}
      >
        <div className="max-w-lg mx-auto">
          {/* Media Preview - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative w-full aspect-square md:aspect-[9/16] rounded-[18px] overflow-hidden bg-gray-100 dark:bg-white/5 mb-6 ring-1 ring-gray-200 dark:ring-white/10"
            style={{ boxShadow: '0 8px 32px rgba(138, 66, 214, 0.12)' }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMediaPreview(true)}
              className="absolute top-3 left-3 z-10 h-8 rounded-full px-4 bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/50 text-gray-900 dark:text-white backdrop-blur-xl border border-gray-200 dark:border-white/20 text-xs font-light transition-all duration-200 shadow-lg"
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
          </motion.div>

          {/* Caption Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            className="mb-6"
          >
            <label className="block text-sm font-light text-gray-500 dark:text-foreground/60 mb-3 tracking-wide">Caption</label>
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
              placeholder="Share your thoughts about this dish..."
              maxLength={maxCaptionLength}
              rows={4}
              className="w-full px-5 py-4 rounded-[14px] border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] font-light"
            />
            <div className="flex justify-end mt-2 px-1">
              <span className="text-xs text-gray-400 dark:text-muted-foreground/50 font-light">
                {caption.length}/{maxCaptionLength}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Restaurant Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            className="rounded-[16px] border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-5 mb-6 active:scale-[0.995] transition-all duration-200 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] cursor-pointer hover:border-gray-300 dark:hover:border-white/10"
            role="button"
            tabIndex={0}
            onClick={() => setIsMenuOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsMenuOpen(true); } }}
          >
            <div className="flex items-center gap-4">
              {/* Restaurant Image */}
              <div className="relative h-16 w-16 rounded-[12px] overflow-hidden bg-gray-100 dark:bg-muted flex-shrink-0 ring-1 ring-gray-200 dark:ring-black/5">
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
                    <span className="text-xl font-light text-primary/60">{restaurantName.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Restaurant Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 dark:text-foreground truncate">
                  {restaurantName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-muted-foreground/70 mt-1 truncate font-light">
                  {restaurantAddress || 'Restaurant'}
                </p>
                {restaurantRating && (
                  <p className="text-xs text-gray-400 dark:text-muted-foreground/60 mt-0.5 font-light">
                    ⭐ {restaurantRating}
                  </p>
                )}
              </div>
            </div>

            {/* Inline CTA */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
              <div className="w-full flex items-center justify-between text-sm">
                <span className="font-light text-gray-600 dark:text-muted-foreground/80">{selectedMenuItem ? selectedMenuItem.name : 'Select Dish or Item'}</span>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-muted-foreground/50" />
              </div>
            </div>
          </motion.div>

          <div role="separator" aria-orientation="horizontal" className="my-6 h-px bg-gray-200 dark:bg-white/5" />

          {/* Rating Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            className="mb-6"
          >
            <NewPostRatings
              taste={rating}
              valueForMoney={valueForMoney}
              wouldOrderAgain={wouldOrderAgain}
              onChangeTaste={setRating}
              onChangeValueForMoney={setValueForMoney}
              onChangeWouldOrderAgain={setWouldOrderAgain}
            />
          </motion.div>
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
              style={{ top: 'calc(var(--post-screen-top-padding-safe) + 0.5rem)' }}
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
        className="border-t border-gray-200 dark:border-white/5 px-5 pt-4 bg-white/80 dark:bg-[#0A0A0F]/80 backdrop-blur-sm flex gap-3 flex-shrink-0 relative z-10"
        style={{ paddingBottom: `${isKeyboardOpen ? 12 : normalizedBottomInset + 12}px` }}
      >
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-[14px] text-base font-light border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/10 transition-all duration-200"
        >
          Save Draft
        </Button>
        <Button
          onClick={() => rating && onPublish({ caption, rating, valueForMoney: valueForMoney ?? undefined, wouldOrderAgain: wouldOrderAgain ?? undefined, menuItemId: selectedMenuItem?.id, menuItemName: selectedMenuItem?.name })}
          disabled={!rating}
          className="flex-1 h-11 rounded-[14px] text-base font-light shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_24px_rgba(138,66,214,0.45)] transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
        >
          Share Post
        </Button>
      </div>
    </div>
  );
}
