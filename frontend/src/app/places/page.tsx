'use client';
// src/app/places/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { placesApi } from '@/lib/api';
import { Place } from '@/types';
import PlaceList from '@/components/places/PlaceList';
import AddPlaceModal from '@/components/places/AddPlaceModal';
import PlaceDetailDrawer from '@/components/places/PlaceDetailDrawer';

export default function PlacesPage() {
  const router = useRouter();
  const { user, isLoading, hydrate } = useAuthStore();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate auth on mount
  useEffect(() => { hydrate(); }, []);

  // Redirect if not authed
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading]);

  const fetchPlaces = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const res = await placesApi.list(q ? { q } : undefined);
      setPlaces(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch places once user is available
  useEffect(() => {
    if (user) fetchPlaces();
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (user) fetchPlaces(search.trim() || undefined);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const handleCreated = (place: Place) => {
    setPlaces((prev) => [place, ...prev]);
  };

  const handleUpdated = (updated: Place) => {
    setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleted = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Back to dashboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="text-sand-400">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 16 C8 10 16 6 16 6 C16 6 24 10 24 16 C24 22 16 26 16 26 C16 26 8 22 8 16Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="font-display font-semibold text-sand-300 tracking-tight">WanderSync</span>
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{user.name}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
              My Saved Places
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {places.length} {places.length === 1 ? 'place' : 'places'} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg
                width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search places…"
                className="pl-9 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500 w-48 sm:w-64"
              />
            </div>
            {/* Add button */}
            <button onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add place
            </button>
          </div>
        </div>

        <PlaceList places={places} loading={loading} onSelect={(id) => setSelectedId(id)} />
      </main>

      {showAdd && (
        <AddPlaceModal
          onClose={() => setShowAdd(false)}
          onCreated={(place) => { handleCreated(place); setShowAdd(false); }}
        />
      )}

      {selectedId && (
        <PlaceDetailDrawer
          placeId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
