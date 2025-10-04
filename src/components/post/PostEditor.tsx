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
  onPublish: () => void;
}

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
  const maxCaptionLength = 2200;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div
        className="bg-background px-4 pt-1 pb-3 border-b border-border/50 flex-shrink-0"
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
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}
      >
        {/* Media Preview */}
        <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-muted shadow-lg ring-1 ring-black/5 mb-6">
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

        {/* Caption Input */}
        <div className="mb-6">
          <textarea
            value={caption}
            onChange={(e) => {
              if (e.target.value.length <= maxCaptionLength) {
                setCaption(e.target.value);
              }
            }}
            placeholder="Add a caption..."
            maxLength={maxCaptionLength}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground placeholder:text-muted-foreground resize-none transition-all"
          />
        </div>

        {/* Restaurant Info */}
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 mb-3">
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
        style={{ paddingBottom: `${safeAreaInsets.bottom}px` }}
      >
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-2xl text-base font-semibold"
        >
          Save Draft
        </Button>
        <Button
          onClick={onPublish}
          className="flex-1 h-12 rounded-2xl text-base font-semibold"
        >
          Share
        </Button>
      </div>
    </div>
  );
}
