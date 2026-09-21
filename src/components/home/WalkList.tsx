import React from 'react';
import { WalkCard } from './WalkCard';
import { HomeEmptyState } from './HomeEmptyState';
import { formatJapaneseDate } from '@/lib/utils/dates';
import type { HomeWalk } from '@/lib/walks/getWalks';

interface Props {
  walks: HomeWalk[];
}

export function WalkList({ walks }: Props) {
  if (walks.length === 0) return <HomeEmptyState />;

  return (
    <div>
      {walks.map((walk) => (
        <WalkCard
          key={walk.id}
          walkId={walk.id}
          title={walk.title}
          location={walk.location}
          selectedTags={walk.selectedTags}
          imageUrl={walk.coverImageUrl}
          createdAt={walk.createdAt}
          formattedDate={formatJapaneseDate(walk.createdAt)}
        />
      ))}
    </div>
  );
}
