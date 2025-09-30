'use client';

import * as React from 'react';
import { 
  MapIcon as MapSolidIcon, 
  MapPinIcon as MapPinSolidIcon, 
  HeartIcon as HeartSolidIcon, 
  VideoCameraIcon as VideoCameraSolidIcon, 
  UserCircleIcon as UserSolidIcon 
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'discover', label: 'Discover', icon: MapSolidIcon },
  { id: 'map', label: 'Map', icon: MapPinSolidIcon },
  { id: 'favourites', label: 'Favourites', icon: HeartSolidIcon },
  { id: 'videos', label: 'Videos', icon: VideoCameraSolidIcon },
  { id: 'profile', label: 'Profile', icon: UserSolidIcon },
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
  const tintMap: Record<string, { light: string; glow: string }> = {
    discover: { light: 'rgba(96, 165, 250, 0.06)', glow: 'rgba(59, 130, 246, 0.1)' },
    map: { light: 'rgba(129, 230, 217, 0.06)', glow: 'rgba(45, 212, 191, 0.1)' },
    favourites: { light: 'rgba(252, 165, 165, 0.06)', glow: 'rgba(248, 113, 113, 0.1)' },
    videos: { light: 'rgba(196, 181, 253, 0.06)', glow: 'rgba(167, 139, 250, 0.1)' },
    profile: { light: 'rgba(196, 196, 255, 0.05)', glow: 'rgba(129, 140, 248, 0.08)' },
  };
  const tint = tintMap[activeTab] || tintMap.discover;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-5 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backdropFilter: 'blur(5px) saturate(140%)',
          WebkitBackdropFilter: 'blur(5px) saturate(140%)',
          boxShadow: '0 16px 32px rgba(15,23,42,0.08)',
        }}
        className={cn(
          "relative w-full max-w-md mx-auto pointer-events-auto overflow-hidden",
          "rounded-[2.5rem]",
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
        {/* Dock-style edge system */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          style={{
            border: '1px solid rgba(255,255,255,0.26)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 55%, transparent 100%)',
            boxShadow: '0 10px 26px rgba(15,23,42,0.04)',
          }}
        />
        <div
          className="absolute inset-[1px] rounded-[2.4rem] pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(15,23,42,0.03)',
            mixBlendMode: 'screen',
            opacity: 0.28,
          }}
        />
        <div
          className="absolute inset-[4px] rounded-[2rem] pointer-events-none"
          style={{
            borderRadius: '2rem',
            background: 'radial-gradient(circle at 18% 15%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 30%, transparent 55%)',
            opacity: 0.22,
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
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            opacity: 0.14,
          }}
        />
        <div
          className="absolute inset-[6px] rounded-[1.9rem] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 52% 10%, ${tint.glow} 0%, transparent 50%)`,
            opacity: 0.12,
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
        <div className="relative flex items-center justify-around px-4 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-[2px]",
                  "min-h-[52px] min-w-[66px] px-3 py-1",
                  "transition-all duration-200 ease-out",
                  "focus-visible:outline-none",
                  "rounded-2xl"
                )}
                aria-label={tab.label}
              >
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 0.9,
                  }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div
                    className="h-[3.6rem] w-[4.75rem] rounded-full"
                    style={{
                      background: isActive
                        ? `linear-gradient(180deg, rgba(107,114,128,0.24) 0%, rgba(107,114,128,0.18) 50%, rgba(148,163,184,0.12) 100%)`
                        : 'transparent',
                      boxShadow: 'none',
                    }}
                  />
                </motion.div>
                {/* Icon */}
                <Icon 
                  className={cn(
                    "relative z-10 h-[26px] w-[26px] transition-all duration-200",
                    isActive 
                      ? "text-primary drop-shadow-[0_6px_12px_rgba(59,130,246,0.35)]"
                      : "text-black/80 dark:text-white/80"
                  )}
                />
                
                {/* Label */}
                <span className={cn(
                  "text-[11px] mt-1 block transition-all duration-200",
                  "font-medium leading-tight",
                  isActive 
                    ? "text-primary opacity-100 font-semibold" 
                    : "text-black/80 dark:text-white/75 opacity-95"
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