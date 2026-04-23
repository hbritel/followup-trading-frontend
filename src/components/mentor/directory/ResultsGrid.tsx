import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import MentorCard from './MentorCard';
import type { DirectoryCardDto, MentorTagDto } from '@/types/dto';

interface ResultsGridProps {
  cards: DirectoryCardDto[];
  tags: MentorTagDto[];
  isLoading: boolean;
}

const CardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl border border-border/50 p-5 flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
    <div className="flex gap-1.5">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
    <div className="flex justify-between items-end pt-2 border-t border-border/30">
      <div className="space-y-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <Skeleton className="h-4 w-14" />
    </div>
  </div>
);

const ResultsGrid: React.FC<ResultsGridProps> = ({ cards, tags, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => (
        <MentorCard key={card.id} card={card} tags={tags} />
      ))}
    </div>
  );
};

export default ResultsGrid;
