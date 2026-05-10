'use client';
// src/app/dashboard/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tripsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { Trip } from '@/types';
import CreateTripModal from '@/components/ui/CreateTripModal';
import JoinTripModal from '@/components/ui/JoinTripModal';
import NotificationBell from '@/components/ui/NotificationBell';
import Avatar from '@/components/ui/Avatar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearAuth, hydrate, isLoading } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading]);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    try {
      const res = await tripsApi.list();
      setTrips(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-sand-400">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 16 C8 10 16 6 16 6 C16 6 24 10 24 16 C24 22 16 26 16 26 C16 26 8 22 8 16Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <span className="font-display font-semibold text-sand-300 tracking-tight">WanderSync</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Avatar name={user.name} size="sm" />
              <span className="hidden sm:inline">{user.name}</span>
            </div>
            <button onClick={clearAuth} className="btn-ghost text-xs px-3 py-1.5">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
              Your Trips
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowJoin(true)} className="btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Join
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Trip
            </button>
          </div>
        </div>

        {/* Trips grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card h-48 animate-pulse bg-[var(--bg-card)]" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sand-500">
                <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0zM12 8v4l3 3"/>
              </svg>
            </div>
            <h3 className="font-display text-lg font-medium text-[var(--text-secondary)] mb-2">No trips yet</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Create your first trip or join one with an invite link</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Plan your first trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onClick={() => router.push(`/trip/${trip.id}`)} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreate={(trip) => { setTrips(t => [trip, ...t]); setShowCreate(false); }}
        />
      )}
      {showJoin && (
        <JoinTripModal
          onClose={() => setShowJoin(false)}
          onJoined={(tripId) => { router.push(`/trip/${tripId}`); }}
        />
      )}
    </div>
  );
}

function TripCard({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  const colors = ['from-amber-900/40', 'from-blue-900/40', 'from-emerald-900/40', 'from-purple-900/40', 'from-rose-900/40'];
  const color = colors[index % colors.length];

  return (
    <button
      onClick={onClick}
      className="card text-left hover:border-[var(--border-light)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 group overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`h-2 bg-gradient-to-r ${color} to-transparent`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display font-semibold text-[var(--text-primary)] text-lg leading-tight group-hover:text-sand-300 transition-colors line-clamp-1">
            {trip.name}
          </h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-[var(--text-muted)] group-hover:text-sand-400 transition-colors flex-shrink-0 mt-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <path d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </div>

        {trip.destination && (
          <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {trip.destination}
          </div>
        )}

        {(trip.startDate || trip.endDate) && (
          <div className="text-xs text-[var(--text-muted)] mb-3">
            {trip.startDate && format(new Date(trip.startDate), 'MMM d')}
            {trip.startDate && trip.endDate && ' – '}
            {trip.endDate && format(new Date(trip.endDate), 'MMM d, yyyy')}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex -space-x-2">
            {trip.members.slice(0, 4).map(m => (
              <Avatar key={m.userId} name={m.user.name} size="xs" className="ring-2 ring-[var(--bg-card)]" />
            ))}
            {trip.members.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-ink-700 ring-2 ring-[var(--bg-card)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                +{trip.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            {trip._count && (
              <>
                <span>{trip._count.itineraryItems} activities</span>
                <span>{trip._count.messages} msgs</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
