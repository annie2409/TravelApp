'use client';
// src/components/voting/VotingPanel.tsx
import { useState } from 'react';
import { votingApi } from '@/lib/api';
import { useTripStore } from '@/lib/stores/tripStore';
import { Suggestion } from '@/types';
import PlaceSearch from '@/components/map/PlaceSearch';
import { PlaceResult } from '@/types';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';

interface Props { tripId: string; userId: string; }

export default function VotingPanel({ tripId, userId }: Props) {
  const { suggestions, addSuggestion, updateSuggestion, deleteSuggestion } = useTripStore();
  const [showAdd, setShowAdd] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  const handleVote = async (id: string, value: 1 | -1) => {
    if (voting) return;
    setVoting(id);
    try {
      const res = await votingApi.vote(id, value);
      updateSuggestion(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this suggestion?')) return;
    try {
      await votingApi.delete(id);
      deleteSuggestion(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Suggestions</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Vote for places to visit together</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Suggest Place
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-card)] mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sand-500">
              <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
            </svg>
          </div>
          <h3 className="font-display text-lg font-medium text-[var(--text-secondary)] mb-2">No suggestions yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5">Suggest places for the group to vote on</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">Suggest a place</button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              rank={i + 1}
              currentUserId={userId}
              onVote={handleVote}
              onDelete={handleDelete}
              isVoting={voting === s.id}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddSuggestionModal
          tripId={tripId}
          onClose={() => setShowAdd(false)}
          onAdd={addSuggestion}
        />
      )}
    </div>
  );
}

function SuggestionCard({ suggestion: s, rank, currentUserId, onVote, onDelete, isVoting }: {
  suggestion: Suggestion;
  rank: number;
  currentUserId: string;
  onVote: (id: string, v: 1 | -1) => void;
  onDelete: (id: string) => void;
  isVoting: boolean;
}) {
  const myVote = s.votes.find(v => v.userId === currentUserId);
  const isOwn = s.userId === currentUserId;

  return (
    <div className="card p-4 flex items-start gap-4 hover:border-[var(--border-light)] transition-all animate-slide-up">
      {/* Rank */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
        rank === 2 ? 'bg-slate-500/20 text-slate-400' :
        rank === 3 ? 'bg-orange-700/20 text-orange-600' :
        'bg-ink-800 text-[var(--text-muted)]'
      }`}>
        {rank}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</h4>
            {s.location && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {s.location}
              </p>
            )}
            {s.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{s.description}</p>
            )}
          </div>
          {isOwn && (
            <button onClick={() => onDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-950/40 text-[var(--text-muted)] hover:text-red-400 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Avatar name={s.user.name} size="xs" />
            <span className="text-xs text-[var(--text-muted)]">{s.user.name}</span>
          </div>

          {/* Vote buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onVote(s.id, -1)}
              disabled={isVoting}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm ${
                myVote?.value === -1
                  ? 'bg-red-900/40 text-red-400'
                  : 'hover:bg-red-950/30 text-[var(--text-muted)] hover:text-red-400'
              }`}
            >
              ↓
            </button>
            <span className={`text-sm font-bold w-6 text-center ${
              s.score > 0 ? 'text-green-400' : s.score < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'
            }`}>
              {s.score}
            </span>
            <button
              onClick={() => onVote(s.id, 1)}
              disabled={isVoting}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm ${
                myVote?.value === 1
                  ? 'bg-green-900/40 text-green-400'
                  : 'hover:bg-green-950/30 text-[var(--text-muted)] hover:text-green-400'
              }`}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddSuggestionModal({ tripId, onClose, onAdd }: {
  tripId: string;
  onClose: () => void;
  onAdd: (s: Suggestion) => void;
}) {
  const [form, setForm] = useState({ title: '', location: '', lat: undefined as number | undefined, lng: undefined as number | undefined, placeId: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handlePlaceSelect = (place: PlaceResult) => {
    setForm(f => ({ ...f, title: f.title || place.name, location: place.address, lat: place.lat, lng: place.lng, placeId: place.placeId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await votingApi.create({ tripId, ...form });
      onAdd(res.data);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Suggest a Place" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" placeholder="e.g. Louvre Museum" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Location</label>
          <PlaceSearch onSelect={handlePlaceSelect} value={form.location}
            onChange={v => setForm(f => ({ ...f, location: v }))} />
        </div>
        <div>
          <label className="label">Why visit?</label>
          <textarea className="input resize-none" rows={2} placeholder="Tell the group why this is worth visiting..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Suggestion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
