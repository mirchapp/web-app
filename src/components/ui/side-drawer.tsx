"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  headerTopPadding?: string; // CSS length for top padding of header/title, includes safe-area if desired
  zIndex?: number; // Custom z-index for nested drawers
  fixedBackButton?: boolean; // If false, back button scrolls with content
}

export function SideDrawer({
  isOpen,
  onClose,
  children,
  showBackButton = true,
  title,
  headerTopPadding,
  zIndex = 60,
  fixedBackButton = true,
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

  // Prevent background scroll when drawer is open
  React.useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.getPropertyValue('overscroll-behavior'),
      bodyOverscroll: body.style.getPropertyValue('overscroll-behavior'),
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.setProperty('overscroll-behavior', 'none');
    body.style.setProperty('overscroll-behavior', 'none');

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      if (prev.htmlOverscroll) {
        html.style.setProperty('overscroll-behavior', prev.htmlOverscroll);
      } else {
        html.style.removeProperty('overscroll-behavior');
      }
      if (prev.bodyOverscroll) {
        body.style.setProperty('overscroll-behavior', prev.bodyOverscroll);
      } else {
        body.style.removeProperty('overscroll-behavior');
      }
    };
  }, [isOpen]);

  // Additionally lock any scrollable containers in the document
  React.useEffect(() => {
    if (!isOpen) return;

    const locked: Array<{ el: HTMLElement; overflow: string; overscroll: string }> = [];

    // Helper to check if element or any parent has higher z-index
    const hasHigherZIndex = (element: HTMLElement): boolean => {
      let current: HTMLElement | null = element;
      while (current) {
        const style = window.getComputedStyle(current);
        const currentZIndex = parseInt(style.zIndex, 10);
        if (!isNaN(currentZIndex) && currentZIndex > zIndex) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    };

    // Find all potentially scrollable elements in the document
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Skip the drawer itself
      if (cardRef.current && cardRef.current.contains(htmlEl)) return;

      // Skip elements within containers with higher z-index (like ProfileDrawer on top)
      if (hasHigherZIndex(htmlEl)) return;

      const computedStyle = window.getComputedStyle(htmlEl);
      const overflowY = computedStyle.overflowY || computedStyle.overflow;
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

      if (isScrollable && htmlEl.scrollHeight > htmlEl.clientHeight) {
        locked.push({
          el: htmlEl,
          overflow: htmlEl.style.overflow,
          overscroll: htmlEl.style.getPropertyValue('overscroll-behavior')
        });
        htmlEl.style.overflow = 'hidden';
        htmlEl.style.setProperty('overscroll-behavior', 'none');
      }
    });

    return () => {
      for (const item of locked) {
        item.el.style.overflow = item.overflow;
        if (item.overscroll) {
          item.el.style.setProperty('overscroll-behavior', item.overscroll);
        } else {
          item.el.style.removeProperty('overscroll-behavior');
        }
      }
    };
  }, [isOpen, zIndex]);

  // Block scroll gestures on the backdrop so the page behind cannot scroll
  const handleBackdropTouchMove = React.useCallback((e: React.TouchEvent) => {
    const target = e.target as Node;
    if (scrollRef.current && scrollRef.current.contains(target)) return; // allow content scrolling
    e.preventDefault();
  }, []);

  const handleBackdropWheel = React.useCallback((e: React.WheelEvent) => {
    const target = e.target as Node;
    if (scrollRef.current && scrollRef.current.contains(target)) return; // allow content scrolling
    e.preventDefault();
  }, []);

  // Global capture to stop background scroll even if events start outside backdrop
  React.useEffect(() => {
    if (!isOpen) return;

    const allowInside = (target: EventTarget | null) => {
      if (!target) return false;
      const node = target as Node;

      // Allow if inside this drawer
      if (cardRef.current && cardRef.current.contains(node)) return true;

      // Allow if inside a higher z-index container (like ProfileDrawer on top)
      if (node instanceof HTMLElement) {
        let current: HTMLElement | null = node;
        while (current) {
          const style = window.getComputedStyle(current);
          const currentZIndex = parseInt(style.zIndex, 10);
          if (!isNaN(currentZIndex) && currentZIndex > zIndex) {
            return true;
          }
          current = current.parentElement;
        }
      }

      return false;
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!allowInside(ev.target)) {
        ev.preventDefault();
      }
    };
    const onWheel = (ev: WheelEvent) => {
      if (!allowInside(ev.target)) {
        ev.preventDefault();
      }
    };

    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
    window.addEventListener('wheel', onWheel, { capture: true, passive: false });

    return () => {
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('wheel', onWheel, { capture: true });
    };
  }, [isOpen, zIndex]);

  if (!isOpen) return null;

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
      className="fixed bg-transparent touch-manipulation"
      style={{
        zIndex,
        top: `calc(-1 * env(safe-area-inset-top))`,
        left: `calc(-1 * env(safe-area-inset-left))`,
        right: `calc(-1 * env(safe-area-inset-right))`,
        bottom: `calc(-1 * env(safe-area-inset-bottom))`,
        willChange: "opacity",
        pointerEvents: isClosing ? "none" : "auto",
        // Prevent scroll chaining to the page behind on browsers that support it
        overscrollBehavior: "none",
      }}
      onClick={handleClose}
      onTouchMove={handleBackdropTouchMove}
      onWheel={handleBackdropWheel}
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
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Drawer Content Wrapper - prevents parent content from showing */}
        <div className="h-full w-full relative bg-white dark:bg-[#0A0A0F]">
          {/* Animated purple wave background - matching profile page */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto relative hide-scrollbar"
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
          {/* Content wrapper with proper top padding */}
          <div style={{ paddingTop: headerTopPadding ?? "var(--overlay-card-top-padding-safe)" }}>
            {/* Header with Back Button and Title */}
            {(showBackButton || title) && (
              <div className="container mx-auto px-4 relative z-10 mb-6">
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center relative">
                    {/* Back Button */}
                    {showBackButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="absolute left-0 h-8 w-8 rounded-full hover:bg-muted/50 bg-background/80 backdrop-blur-sm"
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
                    {/* Title */}
                    {title && (
                      <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                        {title}
                      </h1>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Content */}
            {children}
          </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Render in a portal to escape any transformed/scrolling ancestors
  if (typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return null;
}
