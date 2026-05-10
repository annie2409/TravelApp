'use client';
// src/app/trip/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tripsApi, itineraryApi, chatApi, votingApi, notificationsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTripStore } from '@/lib/stores/tripStore';
import { useTripSocket } from '@/hooks/useSocket';
import { Trip } from '@/types';
import ItineraryPanel from '@/components/itinerary/ItineraryPanel';
import ChatPanel from '@/components/chat/ChatPanel';
import VotingPanel from '@/components/voting/VotingPanel';
import MapComponent from '@/components/map/MapComponent';
import TripHeader from '@/components/ui/TripHeader';
import PresenceBar from '@/components/ui/PresenceBar';

type Tab = 'itinerary' | 'map' | 'voting' | 'chat';

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const { user, hydrate, isLoading } = useAuthStore();
  const store = useTripStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('itinerary');
  const [loading, setLoading] = useState(true);

  // Connect socket and bind real-time events
  useTripSocket(tripId);

  useEffect(() => { hydrate(); }, []);
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading]);

  useEffect(() => {
    if (user && tripId) loadAll();
    return () => store.reset();
  }, [user, tripId]);

  const loadAll = async () => {
    try {
      const [tripRes, itemsRes, msgsRes, suggestionsRes, notifsRes] = await Promise.all([
        tripsApi.get(tripId),
        itineraryApi.list(tripId),
        chatApi.messages(tripId),
        votingApi.list(tripId),
        notificationsApi.list(),
      ]);
      setTrip(tripRes.data);
      store.setItems(itemsRes.data);
      store.setMessages(msgsRes.data);
      store.setSuggestions(suggestionsRes.data);
      store.setNotifications(notifsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sand-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading trip...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'itinerary', label: 'Itinerary',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
    },
    {
      id: 'map', label: 'Map',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>,
    },
    {
      id: 'voting', label: 'Suggest',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>,
      badge: store.suggestions.length || undefined,
    },
    {
      id: 'chat', label: 'Chat',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
      badge: store.messages.length ? undefined : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <TripHeader trip={trip} onBack={() => router.push('/dashboard')} />
      <PresenceBar users={store.onlineUsers} currentUserId={user!.id} />

      {/* Tab bar */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-sand-400 text-sand-300'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && (
                  <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] bg-sand-500 text-ink-950 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === 'itinerary' && (
          <ItineraryPanel tripId={tripId} userId={user!.id} />
        )}
        {activeTab === 'map' && (
          <MapComponent items={store.items} tripId={tripId} />
        )}
        {activeTab === 'voting' && (
          <VotingPanel tripId={tripId} userId={user!.id} />
        )}
        {activeTab === 'chat' && (
          <ChatPanel tripId={tripId} userId={user!.id} userName={user!.name} />
        )}
      </div>
    </div>
  );
}
