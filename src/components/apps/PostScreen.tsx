'use client';

import * as React from 'react';
import { RestaurantSelector } from '@/components/post/RestaurantSelector';
import { PostEditor } from '@/components/post/PostEditor';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  photo?: string;
  distance?: string;
  placeId: string;
}

type PostStep = 'select-restaurant' | 'edit-post';

// Context to share post editor state with AppLayout
export const PostEditorContext = React.createContext<{
  isInEditor: boolean;
  setIsInEditor: (value: boolean) => void;
}>({
  isInEditor: false,
  setIsInEditor: () => {},
});

export function PostScreen() {
  const [currentStep, setCurrentStep] = React.useState<PostStep>('select-restaurant');
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null);
  const [capturedMedia, setCapturedMedia] = React.useState<string | null>(null);
  const [isVideo, setIsVideo] = React.useState(false);

  // Use context to notify AppLayout about editor state
  const { setIsInEditor } = React.useContext(PostEditorContext);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleMediaSelected = (mediaData: string, isVideoFile: boolean) => {
    setCapturedMedia(mediaData);
    setIsVideo(isVideoFile);
    setCurrentStep('edit-post');
    setIsInEditor(true);
  };

  const handleBackFromEditor = () => {
    setCurrentStep('select-restaurant');
    setSelectedRestaurant(null);
    setCapturedMedia(null);
    setIsInEditor(false);
  };

  const handlePublish = (data: { caption: string; rating: string; valueForMoney?: string; wouldOrderAgain?: boolean; menuItemId?: string; menuItemName?: string }) => {
    // TODO: Handle post publishing
    console.log('Publishing post...', data);
  };



  if (currentStep === 'edit-post' && selectedRestaurant && capturedMedia) {
    return (
      <PostEditor
        restaurantName={selectedRestaurant.name}
        restaurantId={selectedRestaurant.placeId}
        restaurantAddress={selectedRestaurant.address}
        restaurantPhoto={selectedRestaurant.photo}
        restaurantRating={selectedRestaurant.rating}
        mediaData={capturedMedia}
        isVideo={isVideo}
        onBack={handleBackFromEditor}
        onPublish={handlePublish}
      />
    );
  }

  return (
    <RestaurantSelector
      onSelectRestaurant={handleSelectRestaurant}
      onMediaSelected={handleMediaSelected}
    />
  );
}


