'use client';
// src/components/ui/TripHeader.tsx
import { useState } from 'react';
import { format } from 'date-fns';
import { Trip } from '@/types';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

interface Props {
  trip: Trip;
  onBack: () => void;
}

export default function TripHeader({ trip, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const copyInviteLink = async () => {
    const url = `${window.location.origin}/join/${trip.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Back */}
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-ink-800 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        {/* Logo dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />

        {/* Trip name */}
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-semibold text-[var(--text-primary)] text-base truncate tracking-tight">
            {trip.name}
          </h1>
          {(trip.destination || trip.startDate) && (
            <p className="text-xs text-[var(--text-muted)] truncate">
              {trip.destination}
              {trip.destination && trip.startDate && ' · '}
              {trip.startDate && format(new Date(trip.startDate), 'MMM d')}
              {trip.startDate && trip.endDate && ' – '}
              {trip.endDate && format(new Date(trip.endDate), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Members preview */}
        <div className="hidden sm:flex items-center -space-x-1.5">
          {trip.members.slice(0, 5).map(m => (
            <Avatar key={m.userId} name={m.user.name} size="xs" className="ring-2 ring-[var(--bg-primary)]" />
          ))}
          {trip.members.length > 5 && (
            <div className="w-5 h-5 rounded-full bg-ink-700 ring-2 ring-[var(--bg-primary)] flex items-center justify-center text-[9px] text-[var(--text-muted)]">
              +{trip.members.length - 5}
            </div>
          )}
        </div>

        {/* Invite */}
        <button
          onClick={copyInviteLink}
          className={`btn-ghost text-xs px-3 py-1.5 transition-all ${copied ? 'text-green-400' : ''}`}
        >
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              <span className="hidden sm:inline">Invite</span>
            </>
          )}
        </button>

        <NotificationBell />
      </div>
    </nav>
  );
}
