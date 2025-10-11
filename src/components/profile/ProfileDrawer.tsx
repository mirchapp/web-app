"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileOverview } from "./ProfileOverview";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function ProfileDrawer({ isOpen, onClose, userId }: ProfileDrawerProps) {
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isHorizontalDrag, setIsHorizontalDrag] = React.useState(false);
  const profileCardRef = React.useRef<HTMLDivElement>(null);
  const profileScrollRef = React.useRef<HTMLDivElement>(null);
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const touchStartScrollTop = React.useRef(0);

  // Reset dragOffset when profile card closes
  React.useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
    }
  }, [isOpen]);

  // Close with animation
  const handleProfileClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 600);
  }, [onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollEl = profileScrollRef.current;
    if (!scrollEl) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = scrollEl.scrollTop;
    setIsHorizontalDrag(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollEl = profileScrollRef.current;
    if (!scrollEl) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    if (!isHorizontalDrag && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      return;
    }

    if (!isHorizontalDrag) {
      setIsHorizontalDrag(Math.abs(deltaX) > Math.abs(deltaY));
    }

    if (isHorizontalDrag || Math.abs(deltaX) > Math.abs(deltaY)) {
      const isAtTop = touchStartScrollTop.current === 0;
      const isSwipingRight = deltaX > 0;

      if (isAtTop && isSwipingRight) {
        e.preventDefault();
        setDragOffset(Math.max(0, deltaX));
        setIsHorizontalDrag(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 100) {
      handleProfileClose();
    } else {
      setDragOffset(0);
    }
    setIsHorizontalDrag(false);
  };

  const drawer = (
    <AnimatePresence mode="wait" onExitComplete={() => setDragOffset(0)}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          className="fixed z-[70] bg-black/20 dark:bg-black/40 backdrop-blur-sm touch-manipulation"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            willChange: "opacity",
            pointerEvents: isClosing ? "none" : "auto",
          }}
          onClick={handleProfileClose}
        >
          <motion.div
            ref={profileCardRef}
            initial={{ x: "100%", y: 0 }}
            animate={{
              x: isClosing ? "100%" : dragOffset > 0 ? dragOffset : 0,
              y: 0,
              transition: {
                type: "tween",
                duration: dragOffset > 0 ? 0 : isClosing ? 0.6 : 0.5,
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
            {/* Profile Content */}
            <div
              ref={profileScrollRef}
              className="h-full overflow-y-auto relative"
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
              {/* Back button */}
              <button
                onClick={handleProfileClose}
                className="absolute top-4 left-4 z-50 w-8 h-8 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-black/30 dark:hover:bg-white/20 transition-colors"
                style={{
                  top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
                }}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>

              {/* Profile Overview Component */}
              <ProfileOverview viewingUserId={userId} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render in a portal to ensure it's at the top level of the DOM
  if (typeof document !== "undefined") {
    return createPortal(drawer, document.body);
  }
  return null;
}
