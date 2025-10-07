'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '../OnboardingContext';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { processImageForUpload, dataURLToFile } from '@/utils/imageProcessing';

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
    }, 'image/jpeg');
  });
}

export function Step2Profile() {
  const { data, updateData, nextStep, saveProgress } = useOnboarding();
  const [displayName, setDisplayName] = React.useState(data.display_name || '');
  const [username, setUsername] = React.useState(data.username || '');
  const [avatarUrl, setAvatarUrl] = React.useState(data.avatar_url || '');
  const [errors, setErrors] = React.useState<{ displayName?: string; username?: string }>({});
  const [isFocusedDisplay, setIsFocusedDisplay] = React.useState(false);
  const [isFocusedUsername, setIsFocusedUsername] = React.useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<boolean | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const usernameCheckTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Crop modal state
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string>('');
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('Profile')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } else {
        setUsernameAvailable(data === null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Debounced username check
  React.useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (username.length >= 3 && /^[a-zA-Z0-9._]+$/.test(username)) {
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsernameAvailability(username);
      }, 500);
    } else {
      setUsernameAvailable(null);
    }

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username]);

  const validate = () => {
    const newErrors: { displayName?: string; username?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, periods, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Process image (convert HEIC if needed, compress)
        const processedFile = await processImageForUpload(file);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImageToCrop(reader.result as string);
          setShowCropModal(true);
        };
        reader.readAsDataURL(processedFile);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try another file.');
      }
    }
  };

  const onCropComplete = React.useCallback((_croppedArea: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImageDataUrl = await getCroppedImg(imageToCrop, croppedAreaPixels);

        // Convert base64 to File
        const file = dataURLToFile(croppedImageDataUrl, `avatar-${Date.now()}.jpg`);

        // Upload to Supabase storage
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('No user found');
        }

        // Generate unique filename with user folder
        const fileExt = 'jpg';
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        // Upload to user_avatars bucket
        const { error: uploadError } = await supabase.storage
          .from('user_avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user_avatars')
          .getPublicUrl(fileName);

        // Set the public URL as avatar
        setAvatarUrl(publicUrl);

        setShowCropModal(false);
        setImageToCrop('');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    } catch (e) {
      console.error('Error saving cropped image:', e);
      alert('Failed to upload avatar. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = async () => {
    if (validate()) {
      const updates = { display_name: displayName, username, avatar_url: avatarUrl };
      updateData(updates);
      await saveProgress(updates);
      nextStep();
    }
  };

  return (
    <>
      <div className="relative space-y-12">
        {/* Subtle ambient glow background */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center space-y-3"
        >
          <h2 className="text-4xl font-thin bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            Tell us about yourself
          </h2>
          <p className="text-muted-foreground/90 dark:text-muted-foreground/80 text-base leading-relaxed max-w-sm mx-auto">
            We&apos;d love to know what to call you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="space-y-8"
        >
          {/* Profile Picture Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="flex flex-col items-center space-y-4"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/15 dark:to-primary/5 border-2 border-dashed border-primary/30 dark:border-primary/20 hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-300 overflow-hidden group"
            >
              {avatarUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="w-10 h-10 text-primary/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-primary/60 font-medium">Add Photo</span>
                </div>
              )}
            </motion.button>
            <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
              Optional — Add a profile picture to personalize your account
            </p>
          </motion.div>

          {/* Display Name Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="space-y-3"
          >
            <Label
              htmlFor="displayName"
              className="text-sm font-medium text-foreground/80 pl-1"
            >
              What should we call you?
            </Label>
            <div className="relative">
              {/* Glowing border on focus */}
              {isFocusedDisplay && (
                <motion.div
                  layoutId="focus-glow-display"
                  className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[15px] blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              <Input
                id="displayName"
                type="text"
                placeholder="e.g., Mike Lazaridis"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errors.displayName) {
                    setErrors({ ...errors, displayName: undefined });
                  }
                }}
                onFocus={() => setIsFocusedDisplay(true)}
                onBlur={() => setIsFocusedDisplay(false)}
                className={`relative h-14 rounded-[14px] border bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm px-4 text-base transition-all duration-300 ${
                  errors.displayName
                    ? 'border-red-500/50 dark:border-red-500/50'
                    : 'border-border/20 dark:border-white/5'
                } ${
                  isFocusedDisplay
                    ? 'shadow-[0_4px_20px_rgba(138,66,214,0.15)] dark:shadow-[0_4px_20px_rgba(138,66,214,0.2)]'
                    : 'shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                } hover:border-primary/20 dark:hover:border-white/10 focus:border-transparent dark:focus:border-transparent focus:outline-none`}
              />
            </div>
            {errors.displayName && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 pl-1"
              >
                {errors.displayName}
              </motion.p>
            )}
          </motion.div>

          {/* Username Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-3"
          >
            <Label
              htmlFor="username"
              className="text-sm font-medium text-foreground/80 pl-1"
            >
              Pick your unique handle
            </Label>
            <div className="relative">
              {/* Glowing border on focus */}
              {isFocusedUsername && (
                <motion.div
                  layoutId="focus-glow-username"
                  className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[15px] blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 dark:text-muted-foreground/60 font-medium text-base z-10 pointer-events-none">
                  @
                </span>
                <Input
                  id="username"
                  type="text"
                  placeholder="mikelazaridis"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    if (errors.username) {
                      setErrors({ ...errors, username: undefined });
                    }
                  }}
                  onFocus={() => setIsFocusedUsername(true)}
                  onBlur={() => setIsFocusedUsername(false)}
                  className={`relative h-14 rounded-[14px] border bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm pl-9 pr-4 text-base transition-all duration-300 ${
                    errors.username
                      ? 'border-red-500/50 dark:border-red-500/50'
                      : 'border-border/20 dark:border-white/5'
                  } ${
                    isFocusedUsername
                      ? 'shadow-[0_4px_20px_rgba(138,66,214,0.15)] dark:shadow-[0_4px_20px_rgba(138,66,214,0.2)]'
                      : 'shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                  } hover:border-primary/20 dark:hover:border-white/10 focus:border-transparent dark:focus:border-transparent focus:outline-none`}
                />
              </div>
            </div>
            {errors.username && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 pl-1"
              >
                {errors.username}
              </motion.p>
            )}
            {!errors.username && username.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 pl-1"
              >
                {isCheckingUsername ? (
                  <>
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground/60">Checking availability...</p>
                  </>
                ) : usernameAvailable === true ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xs text-green-500">@{username} is available!</p>
                  </>
                ) : usernameAvailable === false ? (
                  <>
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-xs text-red-500">Username is already taken</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground/60">Your profile will be at mirch.app/@{username}</p>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="pt-4"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleContinue}
                disabled={!displayName || !username}
                className="w-full h-14 rounded-[14px] font-medium text-base bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_28px_rgba(138,66,214,0.5)] disabled:shadow-[0_2px_8px_rgba(138,66,214,0.2)] transition-all duration-300"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCropCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-background rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h3 className="text-xl font-medium">Adjust your photo</h3>
                <button
                  onClick={handleCropCancel}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cropper */}
              <div className="relative h-[400px] bg-muted/30">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom Control */}
              <div className="p-6 border-t border-border/50 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Zoom</Label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCropCancel}
                    variant="outline"
                    className="flex-1 h-12 rounded-[14px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCropSave}
                    className="flex-1 h-12 rounded-[14px] shadow-[0_4px_20px_rgba(138,66,214,0.35)]"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
