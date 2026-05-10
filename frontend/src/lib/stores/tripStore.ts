// src/lib/stores/tripStore.ts
import { create } from 'zustand';
import { ItineraryItem, Message, Suggestion, Notification, PresenceUser } from '@/types';

interface TripState {
  // Itinerary
  items: ItineraryItem[];
  setItems: (items: ItineraryItem[]) => void;
  addItem: (item: ItineraryItem) => void;
  updateItem: (item: ItineraryItem) => void;
  deleteItem: (id: string) => void;
  reorderItems: (updates: { id: string; order: number; dayIndex: number }[]) => void;

  // Chat
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;

  // Voting
  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;
  addSuggestion: (s: Suggestion) => void;
  updateSuggestion: (s: Suggestion) => void;
  deleteSuggestion: (id: string) => void;

  // Presence
  onlineUsers: PresenceUser[];
  setOnlineUsers: (users: PresenceUser[]) => void;
  addOnlineUser: (user: PresenceUser) => void;
  removeOnlineUser: (userId: string) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markAllRead: () => void;

  // Typing
  typingUsers: { userId: string; name: string }[];
  setTyping: (userId: string, name: string, isTyping: boolean) => void;

  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  items: [],
  messages: [],
  suggestions: [],
  onlineUsers: [],
  notifications: [],
  typingUsers: [],

  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (item) =>
    set((s) => ({ items: s.items.map((i) => (i.id === item.id ? item : i)) })),
  deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  reorderItems: (updates) =>
    set((s) => ({
      items: s.items.map((item) => {
        const u = updates.find((u) => u.id === item.id);
        return u ? { ...item, ...u } : item;
      }),
    })),

  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  setSuggestions: (suggestions) => set({ suggestions }),
  addSuggestion: (s) => set((st) => ({ suggestions: [...st.suggestions, s] })),
  updateSuggestion: (s) =>
    set((st) => ({
      suggestions: st.suggestions
        .map((x) => (x.id === s.id ? s : x))
        .sort((a, b) => b.score - a.score),
    })),
  deleteSuggestion: (id) =>
    set((s) => ({ suggestions: s.suggestions.filter((x) => x.id !== id) })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (user) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.some((u) => u.userId === user.userId)
        ? s.onlineUsers
        : [...s.onlineUsers, user],
    })),
  removeOnlineUser: (userId) =>
    set((s) => ({ onlineUsers: s.onlineUsers.filter((u) => u.userId !== userId) })),

  setNotifications: (notifications) => set({ notifications }),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  setTyping: (userId, name, isTyping) =>
    set((s) => ({
      typingUsers: isTyping
        ? s.typingUsers.some((t) => t.userId === userId)
          ? s.typingUsers
          : [...s.typingUsers, { userId, name }]
        : s.typingUsers.filter((t) => t.userId !== userId),
    })),

  reset: () =>
    set({
      items: [],
      messages: [],
      suggestions: [],
      onlineUsers: [],
      typingUsers: [],
    }),
}));
