'use client';

import * as React from 'react';
import {
  MapIcon as MapSolidIcon,
  MapPinIcon as MapPinSolidIcon,
  HeartIcon as HeartSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon,
  UserCircleIcon as UserSolidIcon,
} from '@heroicons/react/24/solid';
import {
  MapIcon,
  MapPinIcon,
  HeartIcon,
  VideoCameraIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: {
    filled: React.ComponentType<{ className?: string }>;
    outline: React.ComponentType<{ className?: string }>;
  };
}

const tabs: Tab[] = [
  { id: 'discover', label: 'Find', icon: { filled: MapSolidIcon, outline: MapIcon } },
  { id: 'map', label: 'Map', icon: { filled: MapPinSolidIcon, outline: MapPinIcon } },
  { id: 'liked', label: 'Liked', icon: { filled: HeartSolidIcon, outline: HeartIcon } },
  { id: 'videos', label: 'Videos', icon: { filled: VideoCameraSolidIcon, outline: VideoCameraIcon } },
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
  
  const tintMap: Record<string, { light: string; glow: string }> = {
    discover: { light: 'rgba(96, 165, 250, 0.06)', glow: 'rgba(59, 130, 246, 0.1)' },
    map: { light: 'rgba(129, 230, 217, 0.06)', glow: 'rgba(45, 212, 191, 0.1)' },
    liked: { light: 'rgba(252, 165, 165, 0.06)', glow: 'rgba(248, 113, 113, 0.1)' },
    videos: { light: 'rgba(196, 181, 253, 0.06)', glow: 'rgba(167, 139, 250, 0.1)' },
    profile: { light: 'rgba(196, 196, 255, 0.05)', glow: 'rgba(129, 140, 248, 0.08)' },
  };
  const tint = tintMap[activeTab] || tintMap.discover;

  const handleDrag = React.useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    setDragX(clientX);
    
    for (const tab of tabs) {
      const element = tabRefs.current[tab.id];
      if (element) {
        const rect = element.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          if (activeTab !== tab.id) {
            onTabChange(tab.id);
          }
          break;
        }
      }
    }
  }, [activeTab, onTabChange]);

  // Snap to nearest tab center based on last pointer x
  const handleRelease = React.useCallback((event?: MouseEvent | TouchEvent | PointerEvent) => {
    // Robustly read the last known x position
    let x: number | null = null;
    if (event) {
      const anyEvt = event as any;
      if (anyEvt.changedTouches && anyEvt.changedTouches.length > 0) {
        x = anyEvt.changedTouches[0].clientX as number;
      } else if (anyEvt.touches && anyEvt.touches.length > 0) {
        x = anyEvt.touches[0].clientX as number;
      } else if (typeof anyEvt.clientX === 'number') {
        x = anyEvt.clientX as number;
      }
    }
    if (x == null) x = dragX ?? null;
    if (x == null) {
      const containerBounds = containerRef.current?.getBoundingClientRect();
      if (containerBounds) {
        x = containerBounds.left + (pillLayout.left + (pillLayout.width || 0) / 2);
      }
    }
    if (x == null) return;
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
    if (nearestId && nearestId !== activeTab) {
      onTabChange(nearestId);
    }
    // Clear dragX so future releases don't use stale coordinates
    setDragX(null);
  }, [activeTab, dragX, onTabChange]);
  
  // Compute pill layout and update state on mount and whenever dependencies change
  React.useLayoutEffect(() => {
    const compute = () => {
      const containerBounds = containerRef.current?.getBoundingClientRect();
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
    const observer = containerRef.current ? new ResizeObserver(() => compute()) : null;
    if (observer && containerRef.current) observer.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (observer && containerRef.current) observer.disconnect();
    };
  }, [activeTab, isDragging, dragX]);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0.75rem)]">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backdropFilter: 'blur(3px) saturate(140%)',
          WebkitBackdropFilter: 'blur(3px) saturate(140%)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          marginBottom: '0.75rem',
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
        {/* Solid base layer for visibility against dark backgrounds */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
          }}
        />
        {/* Dock-style edge system */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          style={{
            border: '1px solid rgba(255,255,255,0.26)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 65%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.05)',
            mixBlendMode: 'multiply',
            opacity: 0.35,
          }}
        />
        <div
          className="absolute inset-[1px] rounded-[2.4rem] pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(15,23,42,0.04)',
            mixBlendMode: 'screen',
            opacity: 0.26,
          }}
        />
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
        {/* Bottom specular edge */}
        <div
          className="absolute bottom-[6px] left-10 right-10 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
            opacity: 0.22,
          }}
        />
        
        {/* Tab container */}
        <div 
          ref={containerRef}
          className="relative flex items-center justify-between px-4 py-1.5 touch-none select-none overflow-visible"
          onPointerDown={(e) => { setIsDragging(true); handleDrag(e.nativeEvent); }}
          onPointerMove={(e) => {
            if (isDragging) {
              handleDrag(e.nativeEvent);
            }
          }}
          onPointerUp={(e) => { handleRelease(e.nativeEvent); setIsDragging(false); }}
          onPointerCancel={(e) => { handleRelease(e.nativeEvent); setIsDragging(false); }}
          onTouchStart={(e) => { setIsDragging(true); handleDrag(e.nativeEvent); }}
          onTouchMove={(e) => {
            if (isDragging) {
              handleDrag(e.nativeEvent);
            }
          }}
          onTouchEnd={(e) => { handleRelease(e.nativeEvent); setIsDragging(false); }}
        >
          {/* Floating pill that follows pointer and expands while dragging */}
          <motion.span
            className="absolute z-0 rounded-[1.125rem] pointer-events-none"
            animate={{
              top: pillLayout.top,
              bottom: pillLayout.bottom,
              left: pillLayout.left,
              width: pillLayout.width,
            }}
            style={{
              background: 'rgba(138, 43, 226, 0.12)',
              border: '1px solid rgba(167, 139, 250, 0.18)',
              boxShadow: '0 8px 24px rgba(138, 43, 226, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            transition={{
              type: "spring",
              stiffness: isDragging ? 520 : 400,
              damping: isDragging ? 36 : 28,
              mass: isDragging ? 0.6 : 1,
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
                  "min-h-[54px] min-w-[66px] px-3 py-1.5",
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
                >
                  {React.createElement(isActive ? tab.icon.filled : tab.icon.outline, {
                    className: cn(
                      "relative z-10 h-[26px] w-[26px] transition-all duration-200",
                      isActive 
                        ? "text-purple-600 drop-shadow-[0_4px_10px_rgba(167,139,250,0.4)]"
                        : "text-[#333333] dark:text-white/80"
                    ),
                  })}
                </motion.div>
                
                {/* Label */}
                <span className={cn(
                  "relative z-10 text-[11px] mt-1 block transition-all duration-200",
                  "leading-tight",
                  isActive 
                    ? "text-purple-600 opacity-100 font-medium" 
                    : "text-[#333333]/90 dark:text-white/75 opacity-95 font-normal"
                )}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}