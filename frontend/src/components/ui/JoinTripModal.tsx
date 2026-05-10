'use client';
// src/components/ui/JoinTripModal.tsx
import { useState } from 'react';
import { tripsApi } from '@/lib/api';
import Modal from './Modal';

interface Props {
  onClose: () => void;
  onJoined: (tripId: string) => void;
}

export default function JoinTripModal({ onClose, onJoined }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractCode = (value: string): string => {
    // Accept full URL or just the code
    const urlMatch = value.match(/\/join\/([a-f0-9-]+)/i);
    return urlMatch ? urlMatch[1] : value.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractCode(input);
    if (!code) return setError('Please enter an invite code or link');
    setLoading(true);
    try {
      const res = await tripsApi.join(code);
      onJoined(res.data.tripId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Join a Trip" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          Paste an invite link or code from someone in the trip.
        </p>

        <div>
          <label className="label">Invite Link or Code</label>
          <input
            className="input"
            placeholder="https://wandersync.app/join/abc-123... or just the code"
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            required
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Joining...' : 'Join Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
