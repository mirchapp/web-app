'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export type TasteValue = 'loved' | 'liked' | 'meh' | 'not_for_me';

interface ReactionBarProps {
  value: TasteValue | null;
  onChange: (value: TasteValue) => void;
}

const reactions = [
  { value: 'loved' as TasteValue, emoji: '❤️', label: 'Loved it' },
  { value: 'liked' as TasteValue, emoji: '🙂', label: 'Liked it' },
  { value: 'meh' as TasteValue, emoji: '😐', label: "It's okay" },
  { value: 'not_for_me' as TasteValue, emoji: '👎', label: 'Not for me' },
];

// Purple color matching navbar
const primaryColor = 'hsl(262, 83%, 58%)';

export function ReactionBar({ value, onChange }: ReactionBarProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {reactions.map((reaction) => {
        const isSelected = value === reaction.value;
        return (
          <motion.button
            key={reaction.value}
            type="button"
            onClick={() => onChange(reaction.value)}
            aria-pressed={isSelected}
            aria-label={reaction.label}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all relative"
            style={{
              backgroundColor: isSelected ? `${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.08)')}` : 'transparent',
              backdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
              WebkitBackdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
              border: isSelected ? `1px solid ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.2)')}` : '1px solid transparent',
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: isSelected ? 1.02 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
          >
            {/* Soft glow effect when selected */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: `0 0 20px ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.15)')}, inset 0 0 20px ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.05)')}`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            <motion.span
              className="text-4xl leading-none relative z-10"
              animate={{
                scale: isSelected ? 1.1 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 15,
              }}
            >
              {reaction.emoji}
            </motion.span>

            <span
              className="text-xs font-medium transition-colors relative z-10"
              style={{
                color: isSelected ? primaryColor : 'hsl(var(--muted-foreground))',
              }}
            >
              {reaction.label}
            </span>

            {/* Visually hidden label for screen readers */}
            <span className="sr-only">{reaction.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
