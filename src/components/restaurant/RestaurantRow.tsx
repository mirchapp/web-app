'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestaurantRowProps {
  restaurantLogo: string;
  restaurantName: string;
  verified: boolean;
  onClick: () => void;
}

export function RestaurantRow({ restaurantLogo, restaurantName, verified, onClick }: RestaurantRowProps) {
  const [isPressing, setIsPressing] = React.useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        setIsPressing(true);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsPressing(false);
        onClick();
      }}
      onMouseDown={() => {
        setIsPressing(true);
      }}
      onMouseUp={() => {
        setIsPressing(false);
      }}
      onMouseLeave={() => {
        setIsPressing(false);
      }}
      className={cn(
        "flex items-center gap-2 mb-1.5 group touch-manipulation transition-all duration-200",
        isPressing
          ? "translate-y-[-2px] brightness-110"
          : "hover:opacity-90"
      )}
    >
      <div className="relative h-6 w-6 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
        <Image
          src={restaurantLogo}
          alt={restaurantName}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <span
        className="text-sm text-white/90 font-medium group-hover:text-white transition-colors"
        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
      >
        {restaurantName}
      </span>
      {verified && (
        <svg
          className="h-3.5 w-3.5 text-blue-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}
        >
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      <ChevronRight
        className="h-3.5 w-3.5 text-white/70 group-hover:text-white/90 transition-colors"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}
      />
    </button>
  );
}
