'use client';

import * as React from 'react';
import { FeedList } from '@/components/feed/FeedList';
import { getMockHomeFeed } from '@/data/mock/home-feed';

export function HomeFeed() {
  const feed = React.useMemo(() => getMockHomeFeed(), []);

  return (
    <div
      className="h-full overflow-y-auto bg-gradient-to-b from-background via-background/95 to-background"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <FeedList items={feed.items} />
    </div>
  );
}

