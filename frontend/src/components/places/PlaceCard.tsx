'use client';
// src/components/places/PlaceCard.tsx
import { formatDistanceToNow } from 'date-fns';
import { Place } from '@/types';

interface Props {
  place: Place;
  onClick: () => void;
}

export default function PlaceCard({ place, onClick }: Props) {
  const updatedAgo = formatDistanceToNow(new Date(place.updatedAt), { addSuffix: true });

  return (
    <button
      role="article"
      data-testid="place-card"
      onClick={onClick}
      className="card text-left w-full hover:border-[var(--border-light)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 group p-5"
    >
      {/* Name + category */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="font-display font-semibold text-[var(--text-primary)] text-base leading-tight group-hover:text-sand-300 transition-colors line-clamp-2">
          {place.name}
        </h3>
        {place.category && (
          <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-800/40">
            {place.category}
          </span>
        )}
      </div>

      {/* Address */}
      {place.address && (
        <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="line-clamp-1">{place.address}</span>
        </div>
      )}

      {/* Tags */}
      {place.tags && place.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {place.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/30"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: note count + last edited */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>{place._count?.notes ?? 0} {(place._count?.notes ?? 0) === 1 ? 'note' : 'notes'}</span>
        </div>
        <span>Updated {updatedAgo}</span>
      </div>
    </button>
  );
}
