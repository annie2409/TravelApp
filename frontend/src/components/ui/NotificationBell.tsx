'use client';
// src/components/ui/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { notificationsApi } from '@/lib/api';
import { useTripStore } from '@/lib/stores/tripStore';

const typeIcons: Record<string, string> = {
  ACTIVITY_ADDED: '📍',
  ITINERARY_EDITED: '✏️',
  NEW_MESSAGE: '💬',
  MEMBER_JOINED: '👋',
};

export default function NotificationBell() {
  const { notifications, markAllRead } = useTripStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && unread > 0) {
      try {
        await notificationsApi.readAll();
        markAllRead();
      } catch {}
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-ink-800 transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sand-500 text-ink-950 text-[9px] font-bold rounded-full flex items-center justify-center animate-ping-once">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 card shadow-xl shadow-black/40 overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">{notifications.length} total</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                All caught up!
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-ink-800/50 transition-colors ${
                    !n.read ? 'bg-sand-500/5' : ''
                  }`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {typeIcons[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] leading-snug">{n.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sand-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
