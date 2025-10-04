'use client';

import * as React from 'react';
import { RestaurantSelector } from '@/components/post/RestaurantSelector';
import { CameraCapture } from '@/components/post/CameraCapture';
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

type PostStep = 'select-restaurant' | 'camera' | 'edit-post';

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
    setCurrentStep('camera');
  };

  const handleCapture = (mediaData: string, isVideoFile?: boolean) => {
    setCapturedMedia(mediaData);
    setIsVideo(isVideoFile || false);
    setCurrentStep('edit-post');
    setIsInEditor(true);
  };

  const handleBackFromCamera = () => {
    setCurrentStep('select-restaurant');
    setSelectedRestaurant(null);
  };

  const handleBackFromEditor = () => {
    setCurrentStep('camera');
    setCapturedMedia(null);
    setIsInEditor(false);
  };

  const handlePublish = (data: { caption: string; rating: 'loved' | 'liked' | 'meh' | 'not_for_me'; spice?: 'too_mild' | 'just_right' | 'too_hot'; wouldOrderAgain?: boolean; tags?: Array<'spicy' | 'creamy' | 'tangy' | 'protein_heavy'> }) => {
    // TODO: Handle post publishing
    console.log('Publishing post...', data);
  };

  const handleClose = () => {
    // TODO: Handle close action (e.g., navigate back or show confirmation)
    console.log('Close restaurant selector');
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

  if (currentStep === 'camera' && selectedRestaurant) {
    return (
      <CameraCapture
        restaurantName={selectedRestaurant.name}
        onCapture={handleCapture}
        onBack={handleBackFromCamera}
      />
    );
  }

  return (
    <RestaurantSelector
      onSelectRestaurant={handleSelectRestaurant}
    />
  );
}


