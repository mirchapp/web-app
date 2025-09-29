'use client';

import * as React from 'react';
import { Compass, MapPin, Heart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'favourites', label: 'Favourites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
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
  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white/90 dark:bg-black/90",
        "backdrop-blur-sm",
        "border-t border-gray-200/60 dark:border-gray-700/60",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-h-[44px] min-w-[60px] px-2 py-1.5",
                "transition-all duration-200 ease-out",
                "focus-visible:ring-2 focus-visible:ring-primary/50",
                "hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg"
              )}
              aria-label={tab.label}
            >
              {/* No underline - more space for icon */}
              
              {/* Icon with Framer Motion animation */}
              <motion.div
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{
                  scale: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <Icon 
                  className={cn(
                    "h-7 w-7 transition-colors duration-200",
                    "stroke-[1.3]",
                    isActive ? "text-primary" : "text-gray-600 dark:text-gray-400"
                  )}
                />
              </motion.div>
              
              {/* Label with smooth transition */}
              <motion.span 
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  scale: isActive ? 1 : 0.98,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "text-[12px] mt-1 transition-all duration-200",
                  "tracking-tight",
                  isActive 
                    ? "text-primary font-semibold" 
                    : "text-gray-900 dark:text-gray-300 font-normal"
                )}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

// CSS animations are handled via Tailwind classes and inline styles
