import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DinersHome() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Discover Amazing Restaurants</h1>
        <p className="text-muted-foreground text-lg">
          Find the perfect dining experience near you
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Trending</CardTitle>
            <CardDescription>Most popular restaurants this week</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Explore Trending</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Near You</CardTitle>
            <CardDescription>Restaurants within walking distance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Find Nearby</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Places</CardTitle>
            <CardDescription>Recently opened restaurants</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="secondary">Discover New</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
