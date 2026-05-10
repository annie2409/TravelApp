'use client';
// src/components/itinerary/EditItemModal.tsx
import { useState } from 'react';
import { itineraryApi } from '@/lib/api';
import PlaceSearch from '@/components/map/PlaceSearch';
import { ItineraryItem, PlaceResult } from '@/types';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

interface Props {
  item: ItineraryItem;
  onClose: () => void;
}

export default function EditItemModal({ item, onClose }: Props) {
  const [form, setForm] = useState({
    title: item.title,
    location: item.location || '',
    lat: item.lat || undefined,
    lng: item.lng || undefined,
    placeId: item.placeId || '',
    date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '',
    startTime: item.startTime || '',
    endTime: item.endTime || '',
    notes: item.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceSelect = (place: PlaceResult) => {
    setForm(f => ({
      ...f,
      location: place.address,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await itineraryApi.update(item.id, form);
      onClose();
    } catch {
      setError('Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Activity" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label">Location</label>
          <PlaceSearch
            onSelect={handlePlaceSelect}
            value={form.location}
            onChange={v => setForm(f => ({ ...f, location: v }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Start</label>
            <input className="input" type="time" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
          </div>
          <div>
            <label className="label">End</label>
            <input className="input" type="time" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={3} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
