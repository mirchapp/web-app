'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export type ValueForMoneyValue = 'cheap' | 'fair' | 'expensive';

interface FlavorDetailsCardProps {
  valueForMoney: ValueForMoneyValue | null;
  wouldOrderAgain: boolean | null;
  onChangeValueForMoney: (value: ValueForMoneyValue) => void;
  onChangeWouldOrderAgain: (value: boolean) => void;
}

// Purple color matching navbar
const primaryColor = 'hsl(262, 83%, 58%)';

const valueForMoneyOptions = [
  { value: 'cheap' as ValueForMoneyValue, label: '$', ariaLabel: 'Cheap' },
  { value: 'fair' as ValueForMoneyValue, label: '$$', ariaLabel: 'Fair price' },
  { value: 'expensive' as ValueForMoneyValue, label: '$$$', ariaLabel: 'Expensive' },
];

const orderAgainOptions = [
  { value: true, label: 'Yes', emoji: '✅' },
  { value: false, label: 'No', emoji: '❌' },
];

export function FlavorDetailsCard({
  valueForMoney,
  wouldOrderAgain,
  onChangeValueForMoney,
  onChangeWouldOrderAgain,
}: FlavorDetailsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-2xl border border-border/30 p-4 space-y-4"
      style={{
        backdropFilter: 'blur(8px) saturate(140%)',
        WebkitBackdropFilter: 'blur(8px) saturate(140%)',
        backgroundColor: 'hsl(var(--background) / 0.4)',
      }}
    >
      {/* Value for money */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Value for money?</p>
        <div className="flex gap-2">
          {valueForMoneyOptions.map((option) => {
            const isSelected = valueForMoney === option.value;
            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => onChangeValueForMoney(option.value)}
                aria-pressed={isSelected}
                aria-label={option.ariaLabel}
                className="flex-1 h-10 rounded-xl transition-all flex items-center justify-center text-base font-semibold"
                style={{
                  border: isSelected ? `1px solid ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.3)')}` : '1px solid hsl(var(--border) / 0.2)',
                  backgroundColor: isSelected ? `${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.08)')}` : 'transparent',
                  backdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
                  WebkitBackdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
                  color: isSelected ? primaryColor : 'hsl(var(--foreground))',
                  boxShadow: isSelected ? `0 0 12px ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.1)')}` : 'none',
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
                {option.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Would order again */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Would you order this again?</p>
        <div className="flex gap-2">
          {orderAgainOptions.map((option) => {
            const isSelected = wouldOrderAgain === option.value;
            return (
              <motion.button
                key={String(option.value)}
                type="button"
                onClick={() => onChangeWouldOrderAgain(option.value)}
                aria-pressed={isSelected}
                aria-label={option.label}
                className="flex-1 h-10 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-medium"
                style={{
                  border: isSelected ? `1px solid ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.3)')}` : '1px solid hsl(var(--border) / 0.2)',
                  backgroundColor: isSelected ? `${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.08)')}` : 'transparent',
                  backdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
                  WebkitBackdropFilter: isSelected ? 'blur(12px) saturate(150%)' : 'none',
                  color: isSelected ? primaryColor : 'hsl(var(--foreground))',
                  boxShadow: isSelected ? `0 0 12px ${primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.1)')}` : 'none',
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
                <span aria-hidden>{option.emoji}</span>
                <span>{option.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
