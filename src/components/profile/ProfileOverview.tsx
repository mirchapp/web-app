'use client';

import * as React from 'react';
import Image from 'next/image';
import { MapPin, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePWA } from '@/hooks/usePWA';

export function ProfileOverview() {
  return (
    <div className="container mx-auto px-4 pt-12"
    >
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden ring-2 ring-primary/10 dark:ring-primary/20 shadow-sm">
              <Image
                src="/faizaan.jpeg"
                alt="Faizaan Qureshi"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 640px) 128px, 160px"
                unoptimized
              />
            </div>
          </div>
          
          {/* Name */}
          <div className="mb-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Faizaan Qureshi
            </h1>
          </div>
          
          {/* Edit Profile Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-full border-border/50 bg-transparent hover:bg-muted/50"
              onClick={() => {
                // TODO: Navigate to edit profile
                console.log('Edit profile clicked');
              }}
            >
              Edit Profile
            </Button>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-1.5 mb-6 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Waterloo, ON</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-6 px-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-foreground">127</span>
              <span className="text-xs text-muted-foreground">Friends</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-foreground">43</span>
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-foreground">89</span>
              <span className="text-xs text-muted-foreground">Posts</span>
            </div>
          </div>
          
          {/* Bio */}
          <p className="text-center text-base leading-relaxed text-muted-foreground mb-6 px-4">
            Food enthusiast and explorer. Always on the hunt for the perfect dish and hidden gems in the city.
          </p>
          
          {/* Joined Date */}
          <div className="flex items-center gap-1.5 text-muted-foreground mb-8">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Joined September 2024</span>
          </div>

          {/* Flix & Reviews Tabs */}
          <Tabs defaultValue="flix" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-12 bg-background/80 backdrop-blur-xl rounded-2xl p-1 border border-border/20 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <TabsTrigger 
                value="flix" 
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30 transition-all duration-300 ease-out font-medium text-sm"
              >
                Flix
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-primary/30 transition-all duration-300 ease-out font-medium text-sm"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            <TabsContent value="flix" className="mt-6">
              {/* Flix Masonry Grid */}
              <div className="columns-3 gap-2 space-y-2">
                {[
                  { id: 'photo-1546069901-ba9599a7e63c', height: 400 }, // burger
                  { id: 'photo-1565299624946-b28f40a0ae38', height: 500 }, // pizza
                  { id: 'photo-1567620905732-2d1ec7ab7445', height: 350 }, // pancakes
                  { id: 'photo-1540189549336-e6e99c3679fe', height: 450 }, // salad
                  { id: 'photo-1565958011703-44f9829ba187', height: 400 }, // sushi
                  { id: 'photo-1551782450-a2132b4ba21d', height: 380 }, // pasta
                  { id: 'photo-1484723091739-30a097e8f929', height: 420 }, // breakfast
                  { id: 'photo-1550547660-d9450f859349', height: 460 }, // tacos
                  { id: 'photo-1563379926898-05f4575a45d8', height: 390 }, // ramen
                ].map((item, i) => (
                  <div
                    key={i}
                    className="break-inside-avoid mb-2"
                  >
                    <div className="relative rounded-2xl bg-muted overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-200 ease-out cursor-pointer ring-1 ring-black/5 dark:ring-white/10">
                      <Image
                        src={`https://images.unsplash.com/${item.id}?w=400&h=${item.height}&fit=crop`}
                        alt={`Food ${i + 1}`}
                        width={400}
                        height={item.height}
                        className="object-cover w-full"
                        unoptimized
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              {/* Reviews content will go here */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


