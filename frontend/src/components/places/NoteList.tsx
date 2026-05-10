'use client';
// src/components/places/NoteList.tsx
import { useState, useEffect } from 'react';
import { placeNotesApi } from '@/lib/api';
import { PlaceNote } from '@/types';

interface Props {
  placeId: string;
}

export default function NoteList({ placeId }: Props) {
  const [notes, setNotes] = useState<PlaceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');

  useEffect(() => {
    loadNotes();
  }, [placeId]);

  const loadNotes = async () => {
    try {
      const res = await placeNotesApi.list(placeId);
      setNotes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await placeNotesApi.create(placeId, {
        body: body.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
      });
      setNotes((n) => [res.data, ...n]);
      setBody('');
      setSourceUrl('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (note: PlaceNote) => {
    setEditingId(note.id);
    setEditBody(note.body);
    setEditSourceUrl(note.sourceUrl ?? '');
  };

  const handleEdit = async (noteId: string) => {
    try {
      const res = await placeNotesApi.update(noteId, {
        body: editBody.trim(),
        sourceUrl: editSourceUrl.trim() || undefined,
      });
      setNotes((n) => n.map((x) => (x.id === noteId ? res.data : x)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await placeNotesApi.delete(noteId);
      setNotes((n) => n.filter((x) => x.id !== noteId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Notes</h4>

      {/* Add note form */}
      <form onSubmit={handleAdd} className="space-y-2">
        {/* TODO: Replace whitespace-pre-wrap with a markdown renderer (e.g. react-markdown) when added to deps */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500 resize-none"
        />
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Source URL (optional)"
          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
        />
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add note'}
        </button>
      </form>

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] italic">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-sand-500 resize-none"
                  />
                  <input
                    type="url"
                    value={editSourceUrl}
                    onChange={(e) => setEditSourceUrl(e.target.value)}
                    placeholder="Source URL (optional)"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sand-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(note.id)} className="btn-primary text-xs px-3 py-1">Save</button>
                    <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-3 py-1">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* TODO(F7.1): render markdown via a lightweight renderer (e.g., react-markdown) once added to deps. */}
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{note.body}</p>
                  {note.sourceUrl && (
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 block truncate"
                    >
                      {note.sourceUrl}
                    </a>
                  )}
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                      aria-label="Edit note"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      aria-label="Delete note"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
