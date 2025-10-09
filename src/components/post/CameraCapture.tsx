'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeArea } from '@/hooks/useSafeArea';
import NextImage from 'next/image';

interface CameraCaptureProps {
  restaurantName: string;
  onCapture: (imageData: string, isVideo?: boolean) => void;
  onBack: () => void;
}

export function CameraCapture({ restaurantName, onCapture, onBack }: CameraCaptureProps) {
  const safeAreaInsets = useSafeArea();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isVideo, setIsVideo] = React.useState(false);

  // Crop an image dataURL to 9:16 aspect, center-cropped, output JPEG
  const cropToReelsAspect = React.useCallback(async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const targetAspect = 9 / 16; // portrait 9:16

        // Compute crop rectangle for object-fit: cover behavior
        let cropWidth = sourceWidth;
        let cropHeight = Math.round(sourceWidth / targetAspect);
        if (cropHeight > sourceHeight) {
          cropHeight = sourceHeight;
          cropWidth = Math.round(sourceHeight * targetAspect);
        }

        const sx = Math.max(0, Math.floor((sourceWidth - cropWidth) / 2));
        const sy = Math.max(0, Math.floor((sourceHeight - cropHeight) / 2));

        // Output at 1080x1920 for quality (keeps file sizes reasonable)
        const outWidth = 1080;
        const outHeight = 1920;

        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, outWidth, outHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);


  // Handle file input for iOS PWA and fallback
  const handleFileInput = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset the input value to allow re-selecting the same file
    if (e.target) {
      e.target.value = '';
    }

    if (!file) {
      // User cancelled - go back to restaurant selection
      onBack();
      return;
    }

    // Check if it's a video
    const isVideoFile = file.type.startsWith('video/');
    setIsVideo(isVideoFile);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const mediaData = event.target?.result as string;
      if (!mediaData) {
        onBack();
        return;
      }
      if (isVideoFile) {
        onCapture(mediaData, true);
      } else {
        const cropped = await cropToReelsAspect(mediaData);
        onCapture(cropped, false);
      }
    };
    reader.readAsDataURL(file);
  }, [onCapture, onBack, cropToReelsAspect]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Auto-trigger file input when component mounts
  React.useEffect(() => {
    // Trigger file input immediately to maintain user gesture context
    const timer = setTimeout(() => {
      triggerFileInput();
    }, 100); // Small delay to ensure input is mounted

    return () => clearTimeout(timer);
  }, []);

  const handleRetake = () => {
    setCapturedImage(null);
    // Re-trigger file input to select another image
    setTimeout(() => {
      triggerFileInput();
    }, 100);
  };

  const handleConfirm = async () => {
    if (capturedImage) {
      if (isVideo) {
        onCapture(capturedImage, true);
      } else {
        const cropped = await cropToReelsAspect(capturedImage);
        onCapture(cropped, false);
      }
    }
  };

  // Handle file input cancel detection using native event listener
  React.useEffect(() => {
    const fileInput = fileInputRef.current;
    if (!fileInput) return;

    const handleCancel = () => {
      // User cancelled the file picker, go back to restaurant selector
      onBack();
    };

    // Listen for the cancel event
    fileInput.addEventListener('cancel', handleCancel);

    return () => {
      fileInput.removeEventListener('cancel', handleCancel);
    };
  }, [onBack]);

  return (
    <>
      {/* Hidden file input - native media picker */}
      {/* Accept JPEG/PNG explicitly to avoid HEIC issues on iOS */}
      {/* No capture attribute - lets OS show native picker with camera + library options */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,video/mp4,video/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Only show UI if we have a captured image to preview */}
      {capturedImage ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
          style={{
            paddingTop: 'var(--post-screen-top-padding-safe)',
            paddingBottom: `${Math.max(safeAreaInsets.bottom, 16)}px`,
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 px-4 py-4 bg-gradient-to-b from-black/60 to-transparent"
            style={{ paddingTop: 'calc(var(--post-screen-top-padding-safe) + 0.5rem)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white"
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="text-white text-sm font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                {restaurantName}
              </div>
              <div className="w-10" /> {/* Spacer */}
            </div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="text-center"
            >
              <p className="text-sm text-white/70 font-medium">Step 2 of 3 — Capture your dish</p>
            </motion.div>
          </div>

          {/* Preview */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
              {isVideo ? (
                <video
                  src={capturedImage}
                  controls
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <NextImage
                  src={capturedImage}
                  alt="Captured photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-10 pb-safe"
            style={{ paddingBottom: `${Math.max(safeAreaInsets.bottom + 16, 32)}px` }}
          >
            <div className="flex items-center justify-center gap-8 px-4 py-6">
              <Button
                size="lg"
                onClick={handleRetake}
                className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                onClick={handleConfirm}
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg"
              >
                <Check className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}

    </>
  );
}
