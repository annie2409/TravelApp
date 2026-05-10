'use client';
// src/app/join/[code]/page.tsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tripsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hydrate, isLoading } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'joining' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Store invite code and redirect to login
      sessionStorage.setItem('pending_invite', params.code as string);
      router.push('/login');
      return;
    }
    joinTrip();
  }, [user, isLoading]);

  const joinTrip = async () => {
    setStatus('joining');
    try {
      const res = await tripsApi.join(params.code as string);
      router.push(`/trip/${res.data.tripId}`);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.error || 'Invalid or expired invite link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="card p-8 max-w-sm w-full text-center">
        {status === 'loading' || status === 'joining' ? (
          <>
            <div className="w-10 h-10 border-2 border-sand-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[var(--text-secondary)]">
              {status === 'joining' ? 'Joining trip...' : 'Loading...'}
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-red-950/40 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
            </div>
            <h3 className="font-display font-semibold text-[var(--text-primary)] mb-2">Couldn't join</h3>
            <p className="text-sm text-[var(--text-muted)] mb-5">{error}</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary w-full justify-center">
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
