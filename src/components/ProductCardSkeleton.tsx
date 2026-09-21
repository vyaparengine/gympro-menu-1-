import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/20 backdrop-blur-sm p-0">
      {/* Aspect-square image placeholder */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-950 animate-pulse">
        {/* Category tag skeleton */}
        <div className="absolute top-3 left-3 h-5 w-16 rounded-full bg-neutral-800" />
        {/* Status indicator skeleton */}
        <div className="absolute top-3 right-3 h-5 w-20 rounded-full bg-neutral-800" />
      </div>

      {/* Product info section skeleton */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 w-3/4 rounded-lg bg-neutral-800 animate-pulse" />
        
        {/* Description skeletons */}
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-full rounded bg-neutral-850 animate-pulse" />
          <div className="h-3.5 w-5/6 rounded bg-neutral-850 animate-pulse" />
        </div>

        {/* Pricing and Action skeletons */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-800/40 pt-3">
          <div className="space-y-1">
            <div className="h-2.5 w-10 rounded bg-neutral-850 animate-pulse" />
            <div className="h-5 w-16 rounded bg-neutral-800 animate-pulse" />
          </div>

          <div className="h-8 w-24 rounded-xl bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
