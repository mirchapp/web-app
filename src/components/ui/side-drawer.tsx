"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}

export function SideDrawer({
  isOpen,
  onClose,
  children,
  showBackButton = true,
  title,
}: SideDrawerProps) {
  const [isClosing, setIsClosing] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef<number>(0);
  const touchStartY = React.useRef<number>(0);
  const touchCurrentX = React.useRef<number>(0);
  const touchCurrentY = React.useRef<number>(0);
  const isDraggingHorizontally = React.useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const [isHorizontalDrag, setIsHorizontalDrag] = React.useState<boolean>(false);

  // Memoize star positions for background animation
  const starPositions = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    }));
  }, []);

  const handleClose = React.useCallback(() => {
    setDragOffset(0);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 600);
  }, [onClose]);

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

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      className="fixed z-50 bg-transparent touch-manipulation"
      style={{
        top: `calc(-1 * env(safe-area-inset-top))`,
        left: `calc(-1 * env(safe-area-inset-left))`,
        right: `calc(-1 * env(safe-area-inset-right))`,
        bottom: `calc(-1 * env(safe-area-inset-bottom))`,
        willChange: "opacity",
        pointerEvents: isClosing ? "none" : "auto",
      }}
      onClick={handleClose}
    >
      <motion.div
        ref={cardRef}
        initial={{ x: "100%", y: 0 }}
        animate={{
          x: isClosing ? "100%" : (dragOffset > 0 ? dragOffset : 0),
          y: 0,
          transition: {
            type: "tween",
            duration: dragOffset > 0 ? 0 : (isClosing ? 0.6 : 0.5),
            ease: dragOffset > 0 ? "linear" : [0.16, 1, 0.3, 1],
            delay: 0,
          },
        }}
        exit={{
          x: "100%",
          y: 0,
          transition: { type: "tween", duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        }}
        className="absolute right-0 top-0 h-full w-full max-w-md mx-auto bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        drag={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "translateZ(0)",
          touchAction: "none",
        }}
      >
        {/* Drawer Content */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto relative bg-white dark:bg-[#0A0A0F]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            touchAction: isHorizontalDrag ? "none" : "pan-y",
            overflowY: isHorizontalDrag ? "hidden" : "auto",
          }}
        >
          {/* Animated purple wave background - matching profile page */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Purple wave gradient */}
            <div
              className="absolute left-0 right-0 h-[400px] opacity-20 dark:opacity-30"
              style={{
                top: "10%",
                background:
                  "linear-gradient(90deg, rgba(138, 66, 214, 0.4) 0%, rgba(168, 85, 247, 0.3) 50%, rgba(138, 66, 214, 0.4) 100%)",
                filter: "blur(80px)",
                transform: "translateZ(0)",
                animation: "wave 8s ease-in-out infinite alternate",
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
                    willChange: "opacity",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Back Button - Absolute Positioning */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute z-20 h-8 w-8 rounded-full hover:bg-muted/50 bg-background/80 backdrop-blur-sm"
              style={{
                top: "calc(var(--overlay-card-top-padding-safe) + 1rem)",
                left: "1rem",
              }}
            >
              <svg
                className="h-4 w-4"
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
          )}

          {/* Optional Title */}
          {title && (
            <div
              className="container mx-auto px-4 relative z-10"
              style={{ paddingTop: "var(--overlay-card-top-padding-safe)" }}
            >
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                    {title}
                  </h1>
                </div>
              </div>
            </div>
          )}

          {/* Custom Content */}
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
