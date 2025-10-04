'use client';

import * as React from 'react';
import { ReactionBar, type TasteValue } from './ReactionBar';
import { FlavorDetailsCard, type ValueForMoneyValue } from './FlavorDetailsCard';

interface NewPostRatingsProps {
  taste: TasteValue | null;
  valueForMoney: ValueForMoneyValue | null;
  wouldOrderAgain: boolean | null;
  onChangeTaste: (value: TasteValue) => void;
  onChangeValueForMoney: (value: ValueForMoneyValue) => void;
  onChangeWouldOrderAgain: (value: boolean) => void;
}

export function NewPostRatings({
  taste,
  valueForMoney,
  wouldOrderAgain,
  onChangeTaste,
  onChangeValueForMoney,
  onChangeWouldOrderAgain,
}: NewPostRatingsProps) {
  return (
    <div className="space-y-4">
      {/* Section Title */}
      <h3 className="text-sm font-semibold text-foreground">How was it?</h3>

      {/* Reaction Bar */}
      <ReactionBar value={taste} onChange={onChangeTaste} />

      {/* Flavor Details Card - only show if taste is selected */}
      {taste && (
        <FlavorDetailsCard
          valueForMoney={valueForMoney}
          wouldOrderAgain={wouldOrderAgain}
          onChangeValueForMoney={onChangeValueForMoney}
          onChangeWouldOrderAgain={onChangeWouldOrderAgain}
        />
      )}
    </div>
  );
}
