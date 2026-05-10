'use client';
// src/components/places/PlaceList.tsx
import { Place } from '@/types';
import PlaceCard from './PlaceCard';

interface Props {
  places: Place[];
  loading?: boolean;
  onSelect: (id: string) => void;
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-5 bg-[var(--bg-card)] rounded w-2/3 mb-3" />
      <div className="h-3 bg-[var(--bg-card)] rounded w-full mb-2" />
      <div className="h-3 bg-[var(--bg-card)] rounded w-4/5 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-4 bg-[var(--bg-card)] rounded-full w-12" />
        <div className="h-4 bg-[var(--bg-card)] rounded-full w-16" />
      </div>
      <div className="h-px bg-[var(--border)] mb-3" />
      <div className="flex justify-between">
        <div className="h-3 bg-[var(--bg-card)] rounded w-16" />
        <div className="h-3 bg-[var(--bg-card)] rounded w-20" />
      </div>
    </div>
  );
}

export default function PlaceList({ places, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sand-500">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h3 className="font-display text-lg font-medium text-[var(--text-secondary)] mb-2">No places saved yet</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Save restaurants, hotels, attractions and more to build your personal place library.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} onClick={() => onSelect(place.id)} />
      ))}
    </div>
  );
}
