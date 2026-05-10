'use client';
// src/components/places/PlaceDetailDrawer.tsx
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { placesApi } from '@/lib/api';
import { Place } from '@/types';
import NoteList from './NoteList';

interface Props {
  placeId: string;
  onClose: () => void;
  onUpdated: (place: Place) => void;
  onDeleted: (id: string) => void;
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = typeof DAYS[number];

interface HourRow {
  open: string;
  close: string;
}

const CATEGORIES = ['Restaurant', 'Hotel', 'Attraction', 'Café', 'Bar', 'Museum', 'Park', 'Shopping', 'Other'];

function defaultHours(): Record<Day, HourRow> {
  return Object.fromEntries(DAYS.map((d) => [d, { open: '09:00', close: '18:00' }])) as Record<Day, HourRow>;
}

export default function PlaceDetailDrawer({ placeId, onClose, onUpdated, onDeleted }: Props) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [overrideHours, setOverrideHours] = useState(false);
  const [hours, setHours] = useState<Record<Day, HourRow>>(defaultHours());

  useEffect(() => {
    loadPlace();
  }, [placeId]);

  const loadPlace = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await placesApi.get(placeId);
      const p: Place = res.data;
      setPlace(p);
      setName(p.name);
      setAddress(p.address ?? '');
      setCategory(p.category ?? '');
      setOverrideHours(!!p.hoursOverride);
      if (p.openingHours && p.openingHours.length > 0) {
        const mapped = defaultHours();
        for (const h of p.openingHours) {
          mapped[h.weekday] = { open: h.open, close: h.close };
        }
        setHours(mapped);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load place.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!place) return;
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        name: name.trim(),
        address: address.trim() || null,
        category: category || null,
      };
      if (overrideHours) {
        payload.openingHours = DAYS.map((d) => ({
          weekday: d,
          open: hours[d].open,
          close: hours[d].close,
        }));
      }
      const res = await placesApi.update(place.id, payload);
      onUpdated(res.data);
      setPlace(res.data);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!place) return;
    if (!confirm(`Delete "${place.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await placesApi.delete(place.id);
      onDeleted(place.id);
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to delete place.');
    } finally {
      setDeleting(false);
    }
  };

  const setHourField = (day: Day, field: 'open' | 'close', value: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  return (
    <Modal title={place?.name ?? 'Place Details'} onClose={onClose} width="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-sand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error && !place ? (
        <p className="text-sm text-red-400 py-8 text-center">{error}</p>
      ) : place ? (
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Basic fields */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Details</h4>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-sand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-sand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-sand-500"
              >
                <option value="">None</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </section>

          {/* Opening hours override */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="override-hours"
                type="checkbox"
                checked={overrideHours}
                onChange={(e) => setOverrideHours(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-primary)] accent-amber-400"
              />
              <label htmlFor="override-hours" className="text-sm font-medium text-[var(--text-secondary)]">
                Override opening hours
              </label>
            </div>
            {overrideHours && (
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-primary)]">
                      <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Day</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Opens</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]">Closes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, idx) => (
                      <tr key={day} className={idx % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-primary)]'}>
                        <td className="px-3 py-2 text-[var(--text-secondary)] capitalize font-medium">{day}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="time"
                            value={hours[day].open}
                            onChange={(e) => setHourField(day, 'open', e.target.value)}
                            className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sand-500"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="time"
                            value={hours[day].close}
                            onChange={(e) => setHourField(day, 'close', e.target.value)}
                            className="bg-transparent border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-sand-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Notes */}
          <section>
            <NoteList placeId={place.id} />
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20 text-sm disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete Place'}
            </button>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
