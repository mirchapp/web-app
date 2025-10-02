'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Star, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Restaurant } from '@/types/video';

interface RestaurantPageProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export function RestaurantPage({ isOpen, onClose, restaurant }: RestaurantPageProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm touch-manipulation"
          onClick={onClose}
          style={{ willChange: 'opacity' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className="absolute bottom-0 left-0 right-0 h-full w-full bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              perspective: 1000,
            }}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted backdrop-blur-sm shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-all duration-200 touch-manipulation"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>

            {/* Restaurant Page Content */}
            <div 
              ref={scrollRef} 
              className="h-full overflow-y-auto relative"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >

              <div className="container mx-auto px-4 pt-12 pb-32">
                <div className="max-w-md mx-auto">
                  <div className="flex flex-col items-center justify-center">
                    {/* Restaurant Logo */}
                    <div className="relative mb-6">
                      <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl overflow-hidden ring-2 ring-primary/10 dark:ring-primary/20 shadow-sm">
                        <Image
                          src={restaurant.logo}
                          alt={restaurant.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>

                    {/* Restaurant Name */}
                    <div className="mb-3">
                      <div className="flex items-center justify-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">
                          {restaurant.name}
                        </h1>
                        {restaurant.verified && (
                          <svg
                            className="h-6 w-6 text-blue-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Restaurant Bio */}
                    <p className="text-base leading-relaxed text-muted-foreground text-center mb-6 px-4 max-w-sm">
                      Experience authentic cuisine with a modern twist. Our award-winning chefs prepare the finest dishes using locally-sourced ingredients in a warm and welcoming atmosphere.
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mb-6">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold text-foreground">{restaurant.rating}</span>
                      <span className="text-sm text-muted-foreground">• Restaurant</span>
                    </div>

                    {/* Distance & Location */}
                    <div className="flex items-center gap-1.5 mb-6 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{restaurant.distance} • {restaurant.address}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full max-w-xs mb-8">
                      <Button
                        className="flex-1 h-11 bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 ease-out rounded-2xl font-medium text-sm"
                        onClick={() => {
                          console.log('Open in map');
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-11 bg-background/80 hover:bg-background backdrop-blur-sm border border-border/30 hover:border-border/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out rounded-2xl font-medium text-sm"
                        onClick={() => {
                          window.open(`tel:${restaurant.phone}`);
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>

                    {/* About Section */}
                    {restaurant.about && (
                      <div className="w-full mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-3">About</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {restaurant.about}
                        </p>
                      </div>
                    )}

                    {/* Hours Section */}
                    {restaurant.hours && (
                      <div className="w-full mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-3">Hours</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monday - Friday</span>
                            <span className="text-foreground font-medium">{restaurant.hours.weekday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Saturday - Sunday</span>
                            <span className="text-foreground font-medium">{restaurant.hours.weekend}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Popular Dishes */}
                    {restaurant.popularDishes && restaurant.popularDishes.length > 0 && (
                      <div className="w-full">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Popular Dishes</h3>
                        <div className="space-y-3">
                          {restaurant.popularDishes.map((dish, index) => (
                            <div key={index} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200">
                              <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-base text-foreground">{dish.name}</p>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-muted-foreground">4.{(7 + index * 2)}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{dish.description}</p>
                                
                                {/* Dish Labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                    Popular
                                  </span>
                                  {index === 0 && (
                                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                      Spicy
                                    </span>
                                  )}
                                  {index === 1 && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                      Vegetarian
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-base font-semibold text-foreground">${dish.price.toFixed(2)}</p>
                                  <span className="text-xs text-muted-foreground">{(23 + index * 5)} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Menu Section */}
                    <div className="w-full mt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-6">Full Menu</h3>
                      
                      {/* Appetizers */}
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-foreground mb-4 flex items-center gap-2">
                          <span className="h-1 w-8 bg-primary rounded-full"></span>
                          Appetizers
                        </h4>
                        <div className="space-y-3">
                          {[
                            { name: "Spring Rolls", description: "Fresh vegetables wrapped in rice paper with peanut sauce", price: 8.99, rating: 4.6, reviews: 42, labels: ["Vegetarian", "Fresh"], image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop" },
                            { name: "Chicken Satay", description: "Grilled chicken skewers with coconut curry sauce", price: 12.99, rating: 4.8, reviews: 67, labels: ["Popular", "Grilled"], image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200&h=200&fit=crop" },
                            { name: "Tom Yum Soup", description: "Spicy and sour soup with shrimp and mushrooms", price: 10.99, rating: 4.5, reviews: 89, labels: ["Spicy", "Soup"], image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop" }
                          ].map((dish, index) => (
                            <div key={index} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200">
                              <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-base text-foreground">{dish.name}</p>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-muted-foreground">{dish.rating}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{dish.description}</p>
                                
                                {/* Dish Labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {dish.labels.map((label, labelIndex) => (
                                    <span key={labelIndex} className={`px-2 py-0.5 text-xs rounded-full ${
                                      label === 'Popular' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      label === 'Spicy' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      label === 'Vegetarian' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-base font-semibold text-foreground">${dish.price.toFixed(2)}</p>
                                  <span className="text-xs text-muted-foreground">{dish.reviews} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Main Courses */}
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-foreground mb-4 flex items-center gap-2">
                          <span className="h-1 w-8 bg-primary rounded-full"></span>
                          Main Courses
                        </h4>
                        <div className="space-y-3">
                          {[
                            { name: "Massaman Curry", description: "Rich and creamy curry with tender beef, potatoes, and peanuts", price: 19.99, rating: 4.7, reviews: 156, labels: ["Popular", "Curry"], image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop" },
                            { name: "Green Curry", description: "Traditional green curry with chicken, eggplant, and basil", price: 17.99, rating: 4.4, reviews: 98, labels: ["Spicy", "Traditional"], image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop" },
                            { name: "Pad See Ew", description: "Wide rice noodles stir-fried with Chinese broccoli and soy sauce", price: 15.99, rating: 4.3, reviews: 73, labels: ["Vegetarian", "Noodles"], image: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=200&h=200&fit=crop" },
                            { name: "Crispy Duck", description: "Half duck with crispy skin served with plum sauce", price: 24.99, rating: 4.9, reviews: 45, labels: ["Premium", "Specialty"], image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop" }
                          ].map((dish, index) => (
                            <div key={index} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200">
                              <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-base text-foreground">{dish.name}</p>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-muted-foreground">{dish.rating}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{dish.description}</p>
                                
                                {/* Dish Labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {dish.labels.map((label, labelIndex) => (
                                    <span key={labelIndex} className={`px-2 py-0.5 text-xs rounded-full ${
                                      label === 'Popular' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      label === 'Spicy' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      label === 'Vegetarian' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                      label === 'Premium' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                      label === 'Specialty' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-base font-semibold text-foreground">${dish.price.toFixed(2)}</p>
                                  <span className="text-xs text-muted-foreground">{dish.reviews} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desserts */}
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-foreground mb-4 flex items-center gap-2">
                          <span className="h-1 w-8 bg-primary rounded-full"></span>
                          Desserts
                        </h4>
                        <div className="space-y-3">
                          {[
                            { name: "Mango Sticky Rice", description: "Sweet sticky rice with fresh mango and coconut cream", price: 8.99, rating: 4.8, reviews: 124, labels: ["Traditional", "Sweet"], image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop" },
                            { name: "Thai Tea Ice Cream", description: "Creamy ice cream flavored with authentic Thai tea", price: 6.99, rating: 4.5, reviews: 87, labels: ["Cold", "Popular"], image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop" },
                            { name: "Fried Banana", description: "Crispy fried banana with honey and sesame seeds", price: 7.99, rating: 4.2, reviews: 56, labels: ["Fried", "Traditional"], image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop" }
                          ].map((dish, index) => (
                            <div key={index} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200">
                              <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-base text-foreground">{dish.name}</p>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-muted-foreground">{dish.rating}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{dish.description}</p>
                                
                                {/* Dish Labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {dish.labels.map((label, labelIndex) => (
                                    <span key={labelIndex} className={`px-2 py-0.5 text-xs rounded-full ${
                                      label === 'Popular' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      label === 'Traditional' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                      label === 'Sweet' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                                      label === 'Cold' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                      label === 'Fried' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-base font-semibold text-foreground">${dish.price.toFixed(2)}</p>
                                  <span className="text-xs text-muted-foreground">{dish.reviews} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Beverages */}
                      <div className="mb-8">
                        <h4 className="text-base font-medium text-foreground mb-4 flex items-center gap-2">
                          <span className="h-1 w-8 bg-primary rounded-full"></span>
                          Beverages
                        </h4>
                        <div className="space-y-3">
                          {[
                            { name: "Thai Iced Tea", description: "Traditional sweet tea with condensed milk", price: 4.99, rating: 4.6, reviews: 203, labels: ["Traditional", "Cold"], image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop" },
                            { name: "Fresh Coconut Water", description: "Refreshing natural coconut water", price: 5.99, rating: 4.4, reviews: 78, labels: ["Fresh", "Healthy"], image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop" },
                            { name: "Lemongrass Ginger Tea", description: "Hot herbal tea with fresh lemongrass and ginger", price: 3.99, rating: 4.7, reviews: 45, labels: ["Hot", "Herbal"], image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop" }
                          ].map((dish, index) => (
                            <div key={index} className="flex gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors duration-200">
                              <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted ring-1 ring-black/5 dark:ring-white/10">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                  <p className="font-medium text-base text-foreground">{dish.name}</p>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-muted-foreground">{dish.rating}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{dish.description}</p>
                                
                                {/* Dish Labels */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {dish.labels.map((label, labelIndex) => (
                                    <span key={labelIndex} className={`px-2 py-0.5 text-xs rounded-full ${
                                      label === 'Traditional' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                      label === 'Cold' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                      label === 'Fresh' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      label === 'Healthy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                      label === 'Hot' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      label === 'Herbal' ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400' :
                                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <p className="text-base font-semibold text-foreground">${dish.price.toFixed(2)}</p>
                                  <span className="text-xs text-muted-foreground">{dish.reviews} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
