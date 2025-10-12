'use client';

import * as React from 'react';
import {
  HeartIcon as HeartSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon,
  UserCircleIcon as UserSolidIcon,
  PlusCircleIcon as PlusCircleSolidIcon,
  MagnifyingGlassIcon as MagnifyingGlassSolidIcon,
} from '@heroicons/react/24/solid';
import {
  HeartIcon,
  VideoCameraIcon,
  UserCircleIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSafeArea } from '@/hooks/useSafeArea';

interface Tab {
  id: string;
  label: string;
  icon: {
    filled: React.ComponentType<{ className?: string }>;
    outline: React.ComponentType<{ className?: string }>;
  };
}

const tabs: Tab[] = [
  { id: 'discover', label: 'Find', icon: { filled: MagnifyingGlassSolidIcon, outline: MagnifyingGlassIcon } },
  { id: 'liked', label: 'Liked', icon: { filled: HeartSolidIcon, outline: HeartIcon } },
  { id: 'post', label: 'Post', icon: { filled: PlusCircleSolidIcon, outline: PlusCircleIcon } },
  { id: 'videos', label: 'Flix', icon: { filled: VideoCameraSolidIcon, outline: VideoCameraIcon } },
  { id: 'profile', label: 'Profile', icon: { filled: UserSolidIcon, outline: UserCircleIcon } },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  className 
}: BottomNavigationProps) {
  const glassFilterId = React.useId();
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragX, setDragX] = React.useState<number | null>(null);
  const [pillLayout, setPillLayout] = React.useState<{ left: number; width: number; top: number; bottom: number }>({ left: 4, width: 0, top: 4, bottom: 4 });
  const getThemeIsDark = React.useCallback(() => {
    if (typeof window === 'undefined') return false;
    const docDark = document.documentElement.classList.contains('dark');
    const mediaDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return docDark || mediaDark;
  }, []);

  const [isDarkBackground, setIsDarkBackground] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const themeDark = document.documentElement.classList.contains('dark') ||
        (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (activeTab === 'videos' || activeTab === 'post') return true;
      return themeDark;
    }
    return activeTab === 'videos' || activeTab === 'post';
  });
  const hasUserScrolledRef = React.useRef(false);
  const safeAreaInsets = useSafeArea();
  
  // Disable drag interactions to avoid interfering with global touch/click events
  const dragEnabled = false;
  
  const tintMap: Record<string, { light: string; glow: string }> = {
    discover: { light: 'rgba(96, 165, 250, 0.06)', glow: 'rgba(59, 130, 246, 0.1)' },
    liked: { light: 'rgba(252, 165, 165, 0.06)', glow: 'rgba(248, 113, 113, 0.1)' },
    post: { light: 'rgba(129, 230, 217, 0.10)', glow: 'rgba(45, 212, 191, 0.16)' },
    videos: { light: 'rgba(196, 181, 253, 0.06)', glow: 'rgba(167, 139, 250, 0.1)' },
    profile: { light: 'rgba(196, 196, 255, 0.05)', glow: 'rgba(129, 140, 248, 0.08)' },
  };
  const tint = tintMap[activeTab] || tintMap.discover;

  const handleDrag = React.useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    setDragX(clientX);

    // Find the tab whose center is closest to the drag position
    let closestTab: string | null = null;
    let closestDistance = Infinity;

    for (const tab of tabs) {
      const element = tabRefs.current[tab.id];
      if (element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const distance = Math.abs(clientX - centerX);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestTab = tab.id;
        }
      }
    }

    // Only change tab if we're reasonably close to a tab center (within half tab width)
    if (closestTab && closestDistance < 60 && activeTab !== closestTab) {
      onTabChange(closestTab);
    }
  }, [activeTab, onTabChange]);

  // Snap to nearest tab center based on last pointer x with velocity consideration
  const handleRelease = React.useCallback((event?: MouseEvent | TouchEvent | PointerEvent) => {
    // Get the release position
    let x: number | null = null;
    if (event) {
      if ('changedTouches' in event && event.changedTouches && event.changedTouches.length > 0) {
        x = event.changedTouches[0].clientX;
      } else if ('touches' in event && event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX;
      } else if ('clientX' in event && typeof event.clientX === 'number') {
        x = (event as MouseEvent | PointerEvent).clientX;
      }
    }

    // Use dragX as fallback
    if (x == null) x = dragX ?? null;

    // If still no position, use current active tab center
    if (x == null) {
      const activeElement = tabRefs.current[activeTab];
      if (activeElement) {
        const rect = activeElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
      }
    }

    if (x == null) {
      // Clear state and return early
      setDragX(null);
      return;
    }

    // Find the nearest tab center
    let nearestId: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const tab of tabs) {
      const el = tabRefs.current[tab.id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const distance = Math.abs(x - centerX);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = tab.id;
      }
    }

    // Always snap to the nearest tab on release
    if (nearestId && nearestId !== activeTab) {
      onTabChange(nearestId);
    }

    // Clear dragX
    setDragX(null);
  }, [activeTab, dragX, onTabChange]);
  
  // Compute pill layout and update state on mount and whenever dependencies change
  React.useLayoutEffect(() => {
    const compute = () => {
      const containerEl = containerRef.current;
      const containerBounds = containerEl?.getBoundingClientRect();
      const activeEl = tabRefs.current[activeTab];
      const top = isDragging ? -10 : 4;
      const bottom = isDragging ? -10 : 4;
      if (!containerBounds) {
        setPillLayout({ left: 4, width: 0, top, bottom });
        return;
      }
      const defaultWidth = containerBounds.width / tabs.length - 8;
      if (isDragging && dragX != null) {
        const relativeX = dragX - containerBounds.left;
        const width = Math.max(56, defaultWidth);
        const leftUnclamped = relativeX - width / 2;
        const left = Math.min(Math.max(leftUnclamped, -24), containerBounds.width - width + 24);
        setPillLayout({ left, width, top, bottom });
        return;
      }
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        const width = rect.width - 8;
        const left = rect.left - containerBounds.left + 4;
        setPillLayout({ left, width, top, bottom });
        return;
      }
      setPillLayout({ left: 4, width: defaultWidth, top, bottom });
    };
    // Run immediately after commit
    const raf = requestAnimationFrame(compute);
    // Recompute on resize
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    const containerElForObserver = containerRef.current;
    const observer = containerElForObserver ? new ResizeObserver(() => compute()) : null;
    if (observer && containerElForObserver) observer.observe(containerElForObserver);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (observer && containerElForObserver) observer.disconnect();
    };
  }, [activeTab, isDragging, dragX]);

  // Detect background brightness without toggling navbar interactivity
  React.useEffect(() => {
    const detectBackground = () => {
      if (!containerRef.current) return;

      // Before first scroll, prefer theme baseline (avoid white flash on dark mode)
      if (!hasUserScrolledRef.current) {
        const themeDark = getThemeIsDark();
        setIsDarkBackground((activeTab === 'videos' || activeTab === 'post') ? true : themeDark);
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      let totalLuminance = 0;
      let sampleCount = 0;
      for (let i = 0; i < 5; i++) {
        const x = rect.left + (rect.width * (i + 1)) / 6;
        const y = rect.top + rect.height / 2;
        const elementsAtPoint = document.elementsFromPoint(x, y);
        for (const element of elementsAtPoint) {
          // Skip elements that are part of the navbar itself
          if (containerRef.current.contains(element)) continue;
          const styles = window.getComputedStyle(element as Element);
          const bgColor = styles.backgroundColor;
          const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            if (a > 0.1) {
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              totalLuminance += luminance;
              sampleCount++;
              break;
            }
          }
        }
      }
      if (sampleCount > 0) {
        const avg = totalLuminance / sampleCount;
        setIsDarkBackground(avg < 0.5);
      } else {
        // Fallback: check if html has dark class (theme-aware)
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkBackground(isDark);
      }
    };

    // Run detection immediately to establish baseline (will prefer theme until first scroll)
    detectBackground();

    // Then run again after a short delay to catch any layout changes and page transitions
    const timeoutIds: NodeJS.Timeout[] = [];
    timeoutIds.push(setTimeout(() => requestAnimationFrame(detectBackground), 0));
    timeoutIds.push(setTimeout(() => requestAnimationFrame(detectBackground), 16));
    timeoutIds.push(setTimeout(() => requestAnimationFrame(detectBackground), 50));
    timeoutIds.push(setTimeout(() => requestAnimationFrame(detectBackground), 150));
    timeoutIds.push(setTimeout(() => requestAnimationFrame(detectBackground), 300));

    let ticking = false;
    const schedule = () => {
      hasUserScrolledRef.current = true;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        detectBackground();
        ticking = false;
      });
    };

    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      timeoutIds.forEach(clearTimeout);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [activeTab, getThemeIsDark]);

  // If the tab changes and user hasn't scrolled yet, reset to theme baseline immediately
  React.useEffect(() => {
    // Reset scroll state when tab changes so we use theme baseline on new page
    hasUserScrolledRef.current = false;
    setIsDarkBackground((activeTab === 'videos' || activeTab === 'post') ? true : getThemeIsDark());
  }, [activeTab, getThemeIsDark]);

  return (
    <div
      className="fixed left-0 right-0 z-50 pointer-events-none px-4"
      style={{
        bottom: 0,
        paddingBottom: `max(${safeAreaInsets.bottom}px, env(safe-area-inset-bottom, 8px))`,
      }}
    >
      <motion.nav 
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          backdropFilter: 'blur(3px) saturate(140%)',
          WebkitBackdropFilter: 'blur(3px) saturate(140%)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
        className={cn(
          "relative w-full max-w-md mx-auto pointer-events-auto overflow-visible",
          "rounded-[1.625rem] sm:rounded-[1.875rem] md:rounded-[2.125rem]",
          className
        )}
      >
        <svg className="absolute h-0 w-0" aria-hidden="true">
          <defs>
            <filter id={glassFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="turbulence" baseFrequency="0.008" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        {/* Adaptive base layer */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none transition-all duration-300"
          style={{
            background: isDarkBackground 
              ? 'rgba(0, 0, 0, 0.4)' 
              : 'rgba(255, 255, 255, 0.75)',
          }}
        />
        {/* Dock-style edge system */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none transition-all duration-300"
          style={{
            border: isDarkBackground 
              ? '1px solid rgba(255,255,255,0.15)' 
              : '1px solid rgba(255,255,255,0.4)',
            background: isDarkBackground
              ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 65%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 65%, transparent 100%)',
            mixBlendMode: 'normal',
          }}
        />
        {/* Removed inner 1px inset layers to avoid visible hairlines on some displays */}
        <div
          className="absolute inset-[4px] rounded-[2rem] pointer-events-none"
          style={{
             borderRadius: '2rem',
             background: 'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 30%, transparent 52%)',
             opacity: 0.18,
             mixBlendMode: 'screen',
           }}
        />
        <div
          className="absolute inset-[6px] rounded-[2rem] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${tint.light} 0%, transparent 45%)`,
            opacity: 0.16,
            mixBlendMode: 'screen',
            transition: 'background 220ms ease-out',
          }}
        />
        
        {/* Neutralizing wash so blurred map doesn't tint the glass */}
        <div
          className="absolute inset-[6px] rounded-[1.9rem] pointer-events-none"
          style={{
            filter: `url(#${glassFilterId})`,
            background: 'radial-gradient(circle at 70% 80%, rgba(255,255,255,0.12) 0%, transparent 60%)',
            opacity: 0.12,
          }}
        />
        {/* Subtle inner glow to keep center luminous */}
        <div
          className="absolute inset-[6px] rounded-[1.9rem] pointer-events-none"
          style={{
             background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
             opacity: 0.12,
           }}
        />
        <div
          className="absolute inset-[6px] rounded-[1.9rem] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 52% 10%, ${tint.glow} 0%, transparent 48%)`,
            opacity: 0.1,
            mixBlendMode: 'screen',
            transition: 'background 220ms ease-out',
          }}
        />
        {/* Removed bottom specular line to prevent thin visible line */}
        
        {/* Tab container */}
        <div 
          ref={containerRef}
          className="relative flex items-center justify-between px-3 py-1 select-none touch-manipulation overflow-visible"
          onPointerDown={dragEnabled ? (e) => { e.preventDefault(); setIsDragging(true); handleDrag(e.nativeEvent); } : undefined}
          onPointerMove={dragEnabled ? (e) => { if (isDragging) { e.preventDefault(); handleDrag(e.nativeEvent); } } : undefined}
          onPointerUp={dragEnabled ? (e) => { e.preventDefault(); handleRelease(e.nativeEvent); setIsDragging(false); } : undefined}
          onPointerCancel={dragEnabled ? (e) => { e.preventDefault(); handleRelease(e.nativeEvent); setIsDragging(false); } : undefined}
          onTouchStart={dragEnabled ? (e) => { setIsDragging(true); handleDrag(e.nativeEvent); } : undefined}
          onTouchMove={dragEnabled ? (e) => { if (isDragging) { e.preventDefault(); handleDrag(e.nativeEvent); } } : undefined}
          onTouchEnd={dragEnabled ? (e) => { handleRelease(e.nativeEvent); setIsDragging(false); } : undefined}
        >
          {/* Floating pill that follows pointer and expands while dragging */}
          <motion.span
            className="absolute z-0 rounded-[1.125rem] pointer-events-none transition-colors duration-300"
            animate={{
              top: pillLayout.top,
              bottom: pillLayout.bottom,
              left: pillLayout.left,
              width: pillLayout.width,
            }}
            style={{
              background: isDarkBackground
                ? 'rgba(192, 132, 252, 0.2)'
                : 'color-mix(in oklab, var(--primary) 16%, transparent)',
              border: isDarkBackground
                ? '1px solid rgba(192, 132, 252, 0.35)'
                : '1px solid color-mix(in oklab, var(--primary) 28%, transparent)',
              boxShadow: isDarkBackground
                ? '0 8px 24px rgba(192, 132, 252, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                : '0 8px 24px color-mix(in oklab, var(--primary) 22%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 35,
              mass: 0.6,
              restDelta: 0.001,
              restSpeed: 0.001,
            }}
          />
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-[0.5px]",
                  "min-h-[48px] min-w-[60px] px-2.5 py-1",
                  "transition-all duration-200 ease-out",
                  "focus-visible:outline-none",
                  "rounded-2xl"
                )}
                aria-label={tab.label}
              >
                {/* Active pill background is now rendered once above, so no per-tab pill */}
                {/* Icon with bounce animation */}
                <motion.div
                  className="relative z-10"
                  animate={{
                    scale: isActive ? 1.08 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                    duration: 0.1,
                  }}
                  style={{
                    strokeWidth: isActive ? undefined : 1.5,
                  }}
                >
                  {React.createElement(isActive ? tab.icon.filled : tab.icon.outline, {
                    className: cn(
                      "relative z-10 h-[26px] w-[26px] transition-all duration-200",
                      isActive 
                        ? isDarkBackground
                          ? "text-purple-400 drop-shadow-[0_4px_10px_rgba(192,132,252,0.4)]"
                          : "text-primary drop-shadow-[0_4px_10px_color-mix(in_oklab,var(--primary)_40%,transparent)]"
                        : isDarkBackground 
                          ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" 
                          : "text-gray-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]"
                    ),
                  })}
                </motion.div>
                
                {/* Labels removed for a cleaner, icon-only nav */}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}