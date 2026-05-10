'use client';
// src/components/places/AddPlaceModal.tsx
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { placesApi } from '@/lib/api';
import { Place } from '@/types';

interface Props {
  onClose: () => void;
  onCreated: (place: Place) => void;
}

type Tab = 'url' | 'manual';

const CATEGORIES = ['Restaurant', 'Hotel', 'Attraction', 'Café', 'Bar', 'Museum', 'Park', 'Shopping', 'Other'];

export default function AddPlaceModal({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<Tab>('url');

  // URL tab state
  const [url, setUrl] = useState('');
  const [hintName, setHintName] = useState('');
  const [hintLat, setHintLat] = useState('');
  const [hintLng, setHintLng] = useState('');
  const [urlError, setUrlError] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Manual tab state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setUrlLoading(true);
    setUrlError('');
    try {
      const hint: Record<string, unknown> = {};
      if (hintName.trim()) hint.name = hintName.trim();
      if (hintLat.trim()) hint.lat = parseFloat(hintLat);
      if (hintLng.trim()) hint.lng = parseFloat(hintLng);
      const res = await placesApi.importUrl({ url: url.trim(), hint: Object.keys(hint).length ? hint : undefined });
      onCreated(res.data);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string; error?: string } } };
      if (axiosErr?.response?.status === 422) {
        const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error || 'Could not import URL automatically.';
        setUrlError(msg);
        // Pre-fill manual tab with hint data
        if (hintName) setName(hintName);
        if (hintLat) setLat(hintLat);
        if (hintLng) setLng(hintLng);
        setTab('manual');
      } else {
        setUrlError('Something went wrong. Please try again.');
      }
    } finally {
      setUrlLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setManualError('Name is required.'); return; }
    setManualLoading(true);
    setManualError('');
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await placesApi.create({
        name: name.trim(),
        address: address.trim() || undefined,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        category: category || undefined,
        tags: tagList.length ? tagList : undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setManualError(axiosErr?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <Modal title="Add a Place" onClose={onClose} width="max-w-lg">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[var(--bg-primary)] rounded-lg p-1">
        {(['url', 'manual'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              tab === t
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t === 'url' ? 'Paste URL' : 'Manual'}
          </button>
        ))}
      </div>

      {tab === 'url' ? (
        <form onSubmit={handleUrlSubmit} className="space-y-3">
          {urlError && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              {urlError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">URL *</label>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://maps.google.com/… or any place URL"
              rows={3}
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500 resize-none"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">Optional hints to help parsing:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                value={hintName}
                onChange={(e) => setHintName(e.target.value)}
                placeholder="Place name (hint)"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
              />
            </div>
            <input
              type="number"
              step="any"
              value={hintLat}
              onChange={(e) => setHintLat(e.target.value)}
              placeholder="Lat (hint)"
              className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
            />
            <input
              type="number"
              step="any"
              value={hintLng}
              onChange={(e) => setHintLng(e.target.value)}
              placeholder="Lng (hint)"
              className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={urlLoading || !url.trim()} className="btn-primary disabled:opacity-50">
              {urlLoading ? 'Importing…' : 'Import'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          {manualError && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              {manualError}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Place name"
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, Country"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="48.8566"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="2.3522"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-sand-500"
            >
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="michelin, romantic, outdoor (comma-separated)"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={manualLoading || !name.trim()} className="btn-primary disabled:opacity-50">
              {manualLoading ? 'Saving…' : 'Add Place'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
