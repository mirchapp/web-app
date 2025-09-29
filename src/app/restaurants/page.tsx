import { RestaurantsLayout } from '@/components/layouts/RestaurantsLayout';
import { RestaurantsDashboard } from '@/components/apps/RestaurantsDashboard';

export default function RestaurantsPage() {
  return (
    <RestaurantsLayout>
      <RestaurantsDashboard />
    </RestaurantsLayout>
  );
}
