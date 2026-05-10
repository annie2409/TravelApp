'use client';
// src/components/ui/PresenceBar.tsx
import { PresenceUser } from '@/types';
import Avatar from './Avatar';

interface Props {
  users: PresenceUser[];
  currentUserId: string;
}

export default function PresenceBar({ users, currentUserId }: Props) {
  if (users.length === 0) return null;

  const others = users.filter(u => u.userId !== currentUserId);
  if (others.length === 0) return null;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-[var(--text-muted)]">Also here:</span>
        <div className="flex items-center gap-1.5">
          {others.slice(0, 6).map(u => (
            <div key={u.userId} className="flex items-center gap-1 bg-ink-800 rounded-full pl-0.5 pr-2 py-0.5">
              <Avatar name={u.name} size="xs" />
              <span className="text-[11px] text-[var(--text-secondary)]">{u.name.split(' ')[0]}</span>
            </div>
          ))}
          {others.length > 6 && (
            <span className="text-xs text-[var(--text-muted)]">+{others.length - 6} more</span>
          )}
        </div>
      </div>
    </div>
  );
}
