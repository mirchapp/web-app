'use client';

import * as React from 'react';
import { useSafeArea } from '@/hooks/useSafeArea';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostEditorProps {
  restaurantName: string;
  restaurantId: string;
  restaurantAddress?: string;
  restaurantPhoto?: string;
  restaurantRating?: number;
  mediaData: string;
  isVideo: boolean;
  onBack: () => void;
  onPublish: (data: { caption: string; rating: RatingValue; spice?: SpiceValue; wouldOrderAgain?: boolean; tags?: TagValue[] }) => void;
}

type RatingValue = 'loved' | 'liked' | 'meh' | 'not_for_me';
type SpiceValue = 'too_mild' | 'just_right' | 'too_hot';
type TagValue = 'spicy' | 'creamy' | 'tangy' | 'protein_heavy';

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
  const [rating, setRating] = React.useState<RatingValue | null>(null);
  const [spice, setSpice] = React.useState<SpiceValue | null>(null);
  const [wouldOrderAgain, setWouldOrderAgain] = React.useState<boolean | null>(null);
  const [showMore, setShowMore] = React.useState(false);
  const [tags, setTags] = React.useState<TagValue[]>([]);
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

  const ratingOptions: Array<{ value: RatingValue; emoji: string; label: string; description: string }> = [
    { value: 'loved', emoji: '❤️', label: 'Loved it', description: 'I’d totally order again; standout dish' },
    { value: 'liked', emoji: '🙂', label: 'Liked it', description: 'It was good; would eat again casually' },
    { value: 'meh', emoji: '😐', label: 'It’s okay', description: 'Average, not memorable' },
    { value: 'not_for_me', emoji: '👎', label: 'Not for me', description: 'Didn’t like it / wouldn’t order again' },
  ];

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
        <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-muted shadow-lg ring-1 ring-black/5 mb-4">
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
                  (el as any).focus({ preventScroll: true });
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
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 mb-4">
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
        </div>

        <div role="separator" aria-orientation="horizontal" className="my-4 h-px bg-border/50" />

        {/* Rating Selector */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">How was it?</h3>
          </div>
          <div role="radiogroup" aria-label="Dish reaction" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ratingOptions.map((opt) => {
              const selected = rating === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${opt.label} — ${opt.description}`}
                  onClick={() => setRating(opt.value)}
                  className={
                    [
                      'h-12 rounded-2xl border px-3 flex items-center justify-center gap-2 transition-colors touch-manipulation',
                      selected
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                    ].join(' ')
                  }
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {opt.emoji}
                  </span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional add-ons appear after a rating is chosen */}
          {rating && (
            <div className="mt-3 space-y-3">
              {/* Spice level */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">How was the spice?</p>
                <div role="radiogroup" aria-label="Spice level" className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'too_mild' as SpiceValue, label: 'Too mild', icon: '🌶️' },
                    { value: 'just_right' as SpiceValue, label: 'Just right', icon: '✅' },
                    { value: 'too_hot' as SpiceValue, label: 'Too hot', icon: '🔥' },
                  ].map((opt) => {
                    const selected = spice === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${opt.label}`}
                        onClick={() => setSpice(opt.value)}
                        className={[
                          'h-10 rounded-xl border px-2 flex items-center justify-center gap-1.5 transition-colors text-xs',
                          selected
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                            : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                        ].join(' ')}
                      >
                        <span aria-hidden>{opt.icon}</span>
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Would order again */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Would you order this again?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: 'Yes', icon: '✅' },
                    { value: false, label: 'No', icon: '❌' },
                  ].map((opt) => {
                    const selected = wouldOrderAgain === opt.value;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${opt.label}`}
                        onClick={() => setWouldOrderAgain(opt.value)}
                        className={[
                          'h-10 rounded-xl border px-3 flex items-center justify-center gap-2 transition-colors text-sm',
                          selected
                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                            : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                        ].join(' ')}
                      >
                        <span aria-hidden>{opt.icon}</span>
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* More button */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMore((v) => !v)}
                  className="h-8 rounded-full px-3 text-xs"
                  aria-expanded={showMore}
                >
                  {showMore ? 'Less' : 'More'}
                </Button>
              </div>

              {showMore && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tag it?</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { value: 'spicy' as TagValue, label: 'Spicy', emoji: '🥵' },
                      { value: 'creamy' as TagValue, label: 'Creamy', emoji: '🧈' },
                      { value: 'tangy' as TagValue, label: 'Tangy', emoji: '🍋' },
                      { value: 'protein_heavy' as TagValue, label: 'Protein-heavy', emoji: '🍗' },
                    ].map((opt) => {
                      const selected = tags.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="checkbox"
                          aria-checked={selected}
                          aria-label={`${opt.label}`}
                          onClick={() =>
                            setTags((prev) =>
                              prev.includes(opt.value)
                                ? prev.filter((t) => t !== opt.value)
                                : [...prev, opt.value]
                            )
                          }
                          className={[
                            'h-10 rounded-xl border px-3 flex items-center justify-center gap-2 transition-colors text-sm',
                            selected
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                              : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                          ].join(' ')}
                        >
                          <span aria-hidden>{opt.emoji}</span>
                          <span className="font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div role="separator" aria-orientation="horizontal" className="my-4 h-px bg-border/50" />

        {/* Select Dish Button */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl border-border/50 hover:bg-muted/50 text-sm font-medium flex items-center justify-between"
        >
          <span>Select Dish or Item</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

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
          onClick={() => rating && onPublish({ caption, rating, spice: spice ?? undefined, wouldOrderAgain: wouldOrderAgain ?? undefined, tags: tags.length ? tags : undefined })}
          disabled={!rating}
          className="flex-1 h-12 rounded-2xl text-base font-semibold"
        >
          Share
        </Button>
      </div>
    </div>
  );
}
