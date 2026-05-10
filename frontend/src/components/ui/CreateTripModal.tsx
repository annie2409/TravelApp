'use client';
// src/components/ui/CreateTripModal.tsx
import { useState } from 'react';
import { tripsApi } from '@/lib/api';
import { Trip } from '@/types';
import Modal from './Modal';

interface Props {
  onClose: () => void;
  onCreate: (trip: Trip) => void;
}

export default function CreateTripModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Trip name is required');
    setLoading(true);
    try {
      const res = await tripsApi.create(form);
      onCreate(res.data);
    } catch {
      setError('Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New Trip" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Trip Name *</label>
          <input
            className="input"
            placeholder="e.g. Paris Summer 2025"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label">Destination</label>
          <input
            className="input"
            placeholder="e.g. Paris, France"
            value={form.destination}
            onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date</label>
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              className="input"
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="What's this trip about?"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
