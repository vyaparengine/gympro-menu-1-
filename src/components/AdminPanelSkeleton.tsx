import React from 'react';
import { X, ShieldAlert, Coins, ShoppingBag } from 'lucide-react';

interface AdminPanelSkeletonProps {
  onClose?: () => void;
}

export const AdminPanelSkeleton: React.FC<AdminPanelSkeletonProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex h-full w-full items-stretch justify-end bg-neutral-950/80 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-5xl flex-col bg-neutral-950/90 border-l border-neutral-900 shadow-2xl">
        
        {/* Header Skeleton */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded bg-neutral-800 animate-pulse" />
            <div className="h-4 w-40 rounded bg-neutral-800 animate-pulse" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {/* Outer body skeleton */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Skeleton */}
          <aside className="w-56 shrink-0 flex-col gap-2 border-r border-neutral-900 bg-neutral-950 px-4 py-6 hidden md:flex">
            {/* Sidebar list items */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 bg-neutral-900/40 animate-pulse"
              >
                <div className="h-4 w-4 rounded-md bg-neutral-800" />
                <div className="h-3 w-24 rounded bg-neutral-800" />
              </div>
            ))}
          </aside>

          {/* Content Main Panel Skeleton */}
          <main className="flex-1 overflow-y-auto p-6 bg-neutral-950/40 space-y-6">
            
            {/* Stats Cards Skeletons */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Stat card 1 */}
              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 backdrop-blur-sm animate-pulse flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-neutral-850" />
                  <div className="h-7 w-28 rounded-md bg-neutral-800" />
                </div>
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-neutral-800 h-10 w-10" />
              </div>

              {/* Stat card 2 */}
              <div className="rounded-2xl border border-neutral-900 bg-neutral-900/20 p-5 backdrop-blur-sm animate-pulse flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-neutral-850" />
                  <div className="h-7 w-12 rounded-md bg-neutral-800" />
                </div>
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-neutral-800 h-10 w-10" />
              </div>
            </div>

            {/* Content List Header Skeleton */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="h-4 w-44 rounded bg-neutral-800 animate-pulse" />
              <div className="h-8 w-20 rounded bg-neutral-900 animate-pulse" />
            </div>

            {/* List Rows Skeletons */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div 
                  key={i}
                  className="rounded-xl border border-neutral-900 bg-neutral-900/10 p-4 space-y-3 animate-pulse"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-32 rounded bg-neutral-800" />
                        <div className="h-3.5 w-16 rounded bg-neutral-850" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-24 rounded bg-neutral-850" />
                        <div className="h-3 w-40 rounded bg-neutral-850" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="h-4 w-16 rounded bg-neutral-800" />
                      <div className="h-5 w-20 rounded bg-neutral-850" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};
