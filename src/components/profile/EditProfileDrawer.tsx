"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/ui/side-drawer";
import { createClient } from "@/utils/supabase/client";
import { processImageForUpload, dataURLToFile } from "@/utils/imageProcessing";
import Cropper from "react-easy-crop";

interface EditProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  } | null;
  onProfileUpdated: () => void;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
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
    }, "image/jpeg");
  });
}

export function EditProfileDrawer({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}: EditProfileDrawerProps) {
  const [displayName, setDisplayName] = React.useState(currentProfile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = React.useState(currentProfile?.avatar_url || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Crop modal state
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string>("");
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Update local state when currentProfile changes
  React.useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name || "");
      setAvatarUrl(currentProfile.avatar_url || "");
    }
  }, [currentProfile]);

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
        console.error("Error processing image:", error);
        setError("Failed to process image. Please try another file.");
      }
    }
  };

  const onCropComplete = React.useCallback(
    (
      _croppedArea: unknown,
      croppedAreaPixels: { x: number; y: number; width: number; height: number }
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropSave = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImageDataUrl = await getCroppedImg(imageToCrop, croppedAreaPixels);

        // Convert base64 to File
        const file = dataURLToFile(croppedImageDataUrl, `avatar-${Date.now()}.jpg`);

        // Upload to Supabase storage
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No user found");
        }

        // Generate unique filename with user folder
        const fileExt = "jpg";
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        // Upload to user_avatars bucket
        const { error: uploadError } = await supabase.storage
          .from("user_avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("user_avatars").getPublicUrl(fileName);

        // Set the public URL as avatar
        setAvatarUrl(publicUrl);

        setShowCropModal(false);
        setImageToCrop("");
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    } catch (e) {
      console.error("Error saving cropped image:", e);
      setError("Failed to upload avatar. Please try again.");
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user found");
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from("Profile")
        .update({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update cache
      localStorage.setItem(
        "cached_profile",
        JSON.stringify({
          display_name: displayName.trim(),
          username: currentProfile?.username,
          avatar_url: avatarUrl,
        })
      );

      onProfileUpdated();
      onClose();
    } catch (e) {
      console.error("Error updating profile:", e);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SideDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Profile"
        headerTopPadding="calc(env(safe-area-inset-top, 0px) + 2rem)"
      >
        <div
          className="container mx-auto px-5 sm:px-6 pb-8 relative z-10"
          style={{
            paddingTop: "0.25rem",
          }}
        >
          <div className="max-w-md mx-auto space-y-8">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[14px] bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-900/30"
              >
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 shadow-lg hover:shadow-xl hover:ring-gray-300 dark:hover:ring-white/20 transition-all duration-300 group"
              >
                {avatarUrl ? (
                  <>
                    <Image
                      src={avatarUrl}
                      alt={displayName || "Profile"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 128px, 144px"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-white/10 transition-colors duration-300">
                    <User className="w-16 h-16 sm:w-18 sm:h-18 text-gray-300 dark:text-white/30" />
                  </div>
                )}
              </button>
              <p className="text-xs text-muted-foreground/60 text-center max-w-xs font-light">
                Click to change your profile picture
              </p>
            </div>

            {/* Display Name Field */}
            <div className="space-y-3">
              <Label
                htmlFor="displayName"
                className="text-sm font-medium text-foreground/80 pl-1"
              >
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (error) setError(null);
                }}
                className="h-12 rounded-[14px] border border-border/20 dark:border-white/5 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm px-4 text-base transition-all duration-300 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] hover:border-primary/20 dark:hover:border-white/10 focus:border-primary/30 dark:focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Username Field (Disabled) */}
            <div className="space-y-3">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-foreground/80 pl-1"
              >
                Username
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-medium text-base z-10 pointer-events-none">
                  @
                </span>
                <Input
                  id="username"
                  type="text"
                  value={currentProfile?.username || ""}
                  disabled
                  className="h-12 rounded-[14px] border border-border/20 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.01] backdrop-blur-sm pl-9 pr-4 text-base text-muted-foreground/60 cursor-not-allowed shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                />
              </div>
              <p className="text-xs text-muted-foreground/50 pl-1 font-light">
                Username cannot be changed at this time
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !displayName.trim()}
                className="w-full h-12 rounded-[14px] font-medium text-base bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_28px_rgba(138,66,214,0.5)] disabled:shadow-[0_2px_8px_rgba(138,66,214,0.2)] transition-all duration-300"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
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
