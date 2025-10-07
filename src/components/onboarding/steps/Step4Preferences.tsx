'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useOnboarding } from '../OnboardingContext';
import { Leaf, Wheat, Nut, Shell, Milk, Sprout, DollarSign, Flame } from 'lucide-react';

const cuisines = [
  '🍕 Italian', '🍜 Japanese', '🌮 Mexican', '🍔 American',
  '🍛 Indian', '🥟 Chinese', '🥖 French', '🍗 Korean',
  '🥙 Mediterranean', '🍝 Thai', '🌯 Vietnamese', '🥘 Spanish'
];

interface DietaryRestriction {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Halal icon component with Arabic text
const HalalIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="12" y="16" textAnchor="middle" fontSize="14" fill="currentColor" fontFamily="Arial">حلال</text>
  </svg>
);

// COR Kosher icon component
const KosherIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="12" y="15" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" fontFamily="Arial">COR</text>
  </svg>
);

const dietaryRestrictions: DietaryRestriction[] = [
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    icon: <Leaf className="w-5 h-5" strokeWidth={1.5} />
  },
  {
    id: 'vegan',
    label: 'Vegan',
    icon: <Sprout className="w-5 h-5" strokeWidth={1.5} />
  },
  {
    id: 'gluten-free',
    label: 'Gluten-Free',
    icon: <Wheat className="w-5 h-5" strokeWidth={1.5} />
  },
  {
    id: 'nut-allergy',
    label: 'Nut Allergy',
    icon: <Nut className="w-5 h-5" strokeWidth={1.5} />
  },
  {
    id: 'shellfish-allergy',
    label: 'Shellfish Allergy',
    icon: <Shell className="w-5 h-5" strokeWidth={1.5} />
  },
  {
    id: 'lactose-free',
    label: 'Lactose-Free',
    icon: <Milk className="w-5 h-5" strokeWidth={1.5} />
  },
  {
    id: 'halal',
    label: 'Halal',
    icon: <HalalIcon />
  },
  {
    id: 'kosher',
    label: 'Kosher',
    icon: <KosherIcon />
  }
];

export function Step4Preferences() {
  const { data, updateData, nextStep, saveProgress } = useOnboarding();
  const [selectedCuisines, setSelectedCuisines] = React.useState<string[]>(
    data.favourite_cuisines || []
  );
  const [selectedRestrictions, setSelectedRestrictions] = React.useState<string[]>(
    data.dietary_preferences || []
  );
  const [pricePreference, setPricePreference] = React.useState<number>(
    data.price_preference || 2
  );
  const [spicePreference, setSpicePreference] = React.useState<number>(
    data.spice_preference || 2
  );

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
  };

  const toggleRestriction = (restrictionId: string) => {
    setSelectedRestrictions(prev =>
      prev.includes(restrictionId) ? prev.filter(r => r !== restrictionId) : [...prev, restrictionId]
    );
  };

  const handleContinue = async () => {
    // Strip emojis from cuisines before saving to DB
    const cuisinesWithoutEmojis = selectedCuisines.map(cuisine =>
      cuisine.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()
    );

    const updates = {
      favourite_cuisines: cuisinesWithoutEmojis,
      dietary_preferences: selectedRestrictions,
      price_preference: pricePreference,
      spice_preference: spicePreference
    };
    updateData(updates);
    await saveProgress(updates);
    nextStep();
  };

  const getPriceLabel = (value: number) => {
    const labels = ['$', '$$', '$$$', '$$$$'];
    return labels[value - 1] || '$$';
  };

  const getSpiceLabel = (value: number) => {
    const labels = ['Mild', 'Medium', 'Hot', 'Extra Hot'];
    return labels[value - 1] || 'Medium';
  };

  const handleSkip = async () => {
    await saveProgress();
    nextStep();
  };

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <h2 className="text-4xl font-thin bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          What do you like?
        </h2>
        <p className="text-muted-foreground/90 dark:text-muted-foreground/80 text-base leading-relaxed">
          Select your favorite cuisines
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground/90">Favorite Cuisines</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {cuisines.map((cuisine, index) => (
              <motion.button
                key={cuisine}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => toggleCuisine(cuisine)}
                className={`p-4 rounded-[14px] text-sm font-medium transition-all duration-200 active:scale-95 ${
                  selectedCuisines.includes(cuisine)
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(138,66,214,0.35)]'
                    : 'bg-white/70 dark:bg-white/[0.02] border border-primary/10 dark:border-white/5 hover:bg-primary/5 dark:hover:bg-white/[0.05] hover:border-primary/20 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                }`}
              >
                {cuisine}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-foreground/90">Dietary Restrictions (Optional)</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {dietaryRestrictions.map((restriction, index) => (
              <motion.button
                key={restriction.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                onClick={() => toggleRestriction(restriction.id)}
                className={`p-4 rounded-[14px] text-sm font-medium transition-all duration-200 active:scale-95 flex items-center gap-2.5 ${
                  selectedRestrictions.includes(restriction.id)
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(138,66,214,0.35)]'
                    : 'bg-white/70 dark:bg-white/[0.02] border border-primary/10 dark:border-white/5 hover:bg-primary/5 dark:hover:bg-white/[0.05] hover:border-primary/20 shadow-sm dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
                }`}
              >
                {restriction.icon}
                {restriction.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Price Preference Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground/90 flex items-center gap-2">
              <DollarSign className="w-4 h-4" strokeWidth={1.5} />
              Price Preference
            </h3>
            <span className="text-sm font-medium text-primary">{getPriceLabel(pricePreference)}</span>
          </div>
          <Slider
            value={[pricePreference]}
            onValueChange={(value) => setPricePreference(value[0])}
            min={1}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground/70">
            <span>Budget</span>
            <span>Luxury</span>
          </div>
        </div>

        {/* Spice Preference Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground/90 flex items-center gap-2">
              <Flame className="w-4 h-4" strokeWidth={1.5} />
              Spice Level
            </h3>
            <span className="text-sm font-medium text-primary">{getSpiceLabel(spicePreference)}</span>
          </div>
          <Slider
            value={[spicePreference]}
            onValueChange={(value) => setSpicePreference(value[0])}
            min={1}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground/70">
            <span>Mild</span>
            <span>Extra Hot</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <Button
            onClick={handleContinue}
            disabled={selectedCuisines.length === 0}
            className="w-full h-14 rounded-[14px] font-medium text-base shadow-[0_4px_20px_rgba(138,66,214,0.35)] hover:shadow-[0_6px_24px_rgba(138,66,214,0.45)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="w-full h-14 rounded-[14px] font-medium border-primary/20 dark:border-white/5 bg-white/70 dark:bg-white/[0.02] hover:bg-primary/5 dark:hover:bg-white/[0.05] hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
          >
            Skip for now
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
