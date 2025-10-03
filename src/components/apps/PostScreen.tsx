'use client';

import * as React from 'react';
import { RestaurantSelector } from '@/components/post/RestaurantSelector';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  photo?: string;
  distance?: string;
  placeId: string;
}

export function PostScreen() {
  const handleSelectRestaurant = (restaurant: Restaurant) => {
    // TODO: Navigate to the next step of the post creation flow
    console.log('Selected restaurant:', restaurant);
  };

  const handleClose = () => {
    // TODO: Handle close action (e.g., navigate back or show confirmation)
    console.log('Close restaurant selector');
  };

  return (
    <RestaurantSelector
      onSelectRestaurant={handleSelectRestaurant}
      onClose={handleClose}
    />
  );
}


