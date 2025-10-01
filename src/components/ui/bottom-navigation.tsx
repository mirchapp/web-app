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
  const [isDarkBackground, setIsDarkBackground] = React.useState(false);
  
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
    if (closestTab && closestDistance < 80 && activeTab !== closestTab) {
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
    
    if (x == null) return;
    
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
    if (nearestId) {
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

  // Detect background brightness
  React.useEffect(() => {
    const detectBackground = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      try {
        // Temporarily hide navbar to sample what's behind it
        const originalPointerEvents = containerRef.current.style.pointerEvents;
        const originalVisibility = containerRef.current.style.visibility;
        
        containerRef.current.style.pointerEvents = 'none';
        containerRef.current.style.visibility = 'hidden';
        
        // Sample multiple points across the navbar area
        let totalLuminance = 0;
        let sampleCount = 0;
        
        // Sample 5 points horizontally across the navbar
        for (let i = 0; i < 5; i++) {
          const x = rect.left + (rect.width * (i + 1)) / 6;
          const y = rect.top + rect.height / 2; // Middle of navbar height
          
          const elementsAtPoint = document.elementsFromPoint(x, y);
          
          // Find first non-transparent element
        for (const element of elementsAtPoint) {
          const styles = window.getComputedStyle(element);
          const bgColor = styles.backgroundColor;
            
            // Parse RGB values
            const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1]);
              const g = parseInt(rgbMatch[2]);
              const b = parseInt(rgbMatch[3]);
              const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
              
              // Only use opaque or semi-opaque backgrounds
              if (a > 0.1) {
                // Calculate relative luminance (WCAG formula)
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                totalLuminance += luminance;
                sampleCount++;
                break; // Found a valid background, stop checking this point
              }
            }
          }
        }
        
        // Restore navbar visibility
        containerRef.current.style.pointerEvents = originalPointerEvents;
        containerRef.current.style.visibility = originalVisibility;
        
        if (sampleCount > 0) {
          const avgLuminance = totalLuminance / sampleCount;
          setIsDarkBackground(avgLuminance < 0.5);
        } else {
          // Fallback to light background
          setIsDarkBackground(false);
        }
      } catch {
        // Restore visibility in case of error
        if (containerRef.current) {
          containerRef.current.style.pointerEvents = '';
          containerRef.current.style.visibility = '';
        }
        setIsDarkBackground(false);
      }
    };
    
    // Run initially and on scroll/resize
    detectBackground();
    const interval = setInterval(detectBackground, 100);
    
    window.addEventListener('scroll', detectBackground, true);
    window.addEventListener('resize', detectBackground);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', detectBackground, true);
      window.removeEventListener('resize', detectBackground);
    };
  }, [activeTab]);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4"
      style={{
        paddingBottom: 'var(--safe-area-inset-bottom)',
        paddingTop: 'var(--safe-area-inset-top)',
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
          onPointerDown={(e) => { 
            e.preventDefault();
            setIsDragging(true); 
            handleDrag(e.nativeEvent); 
          }}
          onPointerMove={(e) => {
            if (isDragging) {
              e.preventDefault();
              handleDrag(e.nativeEvent);
            }
          }}
          onPointerUp={(e) => { 
            e.preventDefault();
            setIsDragging(false);
            handleRelease(e.nativeEvent);
          }}
          onPointerCancel={(e) => { 
            e.preventDefault();
            setIsDragging(false);
            handleRelease(e.nativeEvent);
          }}
          onTouchStart={(e) => { 
            setIsDragging(true); 
            handleDrag(e.nativeEvent); 
          }}
          onTouchMove={(e) => {
            if (isDragging) {
              e.preventDefault();
              handleDrag(e.nativeEvent);
            }
          }}
          onTouchEnd={(e) => { 
            setIsDragging(false);
            handleRelease(e.nativeEvent);
          }}
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
              stiffness: isDragging ? 600 : 450,
              damping: isDragging ? 40 : 30,
              mass: isDragging ? 0.5 : 0.8,
              velocity: isDragging ? 0 : 2,
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
                
                {/* Label */}
                <span 
                  className={cn(
                    "relative z-10 text-[11px] mt-1 block transition-all duration-200",
                    "leading-tight",
                    isActive 
                      ? isDarkBackground
                        ? "text-purple-400 opacity-100 font-medium drop-shadow-[0_1px_3px_rgba(192,132,252,0.3)]"
                        : "text-primary opacity-100 font-medium"
                      : isDarkBackground
                        ? "text-white/95 opacity-95 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                        : "text-gray-900/95 opacity-95 font-normal drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]"
                  )}
                >
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