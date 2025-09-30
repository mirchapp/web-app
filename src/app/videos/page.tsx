'use client';

import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlayIcon, 
  ClockIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';

export default function VideosPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Videos</h1>
            <p className="text-muted-foreground">
              Discover amazing food content and cooking tutorials
            </p>
          </div>

          {/* Featured Video */}
          <Card className="mb-8 overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="lg" className="rounded-full h-16 w-16 bg-primary/90 hover:bg-primary">
                  <PlayIcon className="h-8 w-8 ml-1" />
                </Button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                  Featured
                </span>
              </div>
            </div>
            <CardHeader>
              <CardTitle>Amazing Street Food Tour</CardTitle>
              <CardDescription>
                Join us on a culinary journey through the best street food spots in the city
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>12:34</span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  <span>2.3K views</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Quick Pasta Recipe",
                description: "Learn to make delicious pasta in 15 minutes",
                duration: "8:45",
                views: "1.2K",
                thumbnail: "bg-gradient-to-br from-orange-400 to-red-500"
              },
              {
                title: "Coffee Brewing Masterclass",
                description: "Perfect your coffee brewing technique",
                duration: "15:20",
                views: "856",
                thumbnail: "bg-gradient-to-br from-amber-600 to-yellow-500"
              },
              {
                title: "Dessert Decoration Tips",
                description: "Beautiful cake decorating techniques",
                duration: "22:10",
                views: "3.1K",
                thumbnail: "bg-gradient-to-br from-pink-400 to-purple-500"
              },
              {
                title: "Healthy Smoothie Bowl",
                description: "Nutritious and delicious breakfast ideas",
                duration: "6:30",
                views: "945",
                thumbnail: "bg-gradient-to-br from-green-400 to-blue-500"
              }
            ].map((video, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`aspect-video ${video.thumbnail} relative`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="sm" className="rounded-full h-12 w-12 bg-black/70 hover:bg-black/80">
                      <PlayIcon className="h-5 w-5 ml-0.5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                      {video.duration}
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{video.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {video.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <EyeIcon className="h-3 w-3" />
                    <span>{video.views} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
