// src/lib/stores/authStore.ts
import { create } from 'zustand';
import { User } from '@/types';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('ws_token', token);
    localStorage.setItem('ws_user', JSON.stringify(user));
    connectSocket(token);
    set({ user, token, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('ws_token');
    localStorage.removeItem('ws_user');
    disconnectSocket();
    set({ user: null, token: null, isLoading: false });
  },

  hydrate: () => {
    try {
      const token = localStorage.getItem('ws_token');
      const userRaw = localStorage.getItem('ws_user');
      if (token && userRaw) {
        const user = JSON.parse(userRaw) as User;
        connectSocket(token);
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
