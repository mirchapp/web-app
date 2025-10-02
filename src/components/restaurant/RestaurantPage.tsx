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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150) {
                onClose();
              }
            }}
            onDrag={() => {}}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 h-full w-full bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="absolute top-0 left-0 right-0 h-12 z-30 flex justify-center items-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mt-3" />
            </div>

            {/* Restaurant Page Content */}
            <div ref={scrollRef} className="h-full overflow-y-auto relative">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 left-4 z-20 h-8 w-8 rounded-full hover:bg-muted/50 bg-background/80 backdrop-blur-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>

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
                            <div key={index} className="flex gap-3 p-3 rounded-xl bg-muted/50">
                              <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
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
                                <p className="font-medium text-base text-foreground">{dish.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{dish.description}</p>
                                <p className="text-base font-semibold text-foreground mt-2">${dish.price.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
