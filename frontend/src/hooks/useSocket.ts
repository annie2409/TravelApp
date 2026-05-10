// src/hooks/useSocket.ts
'use client';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useTripStore } from '@/lib/stores/tripStore';

export function useTripSocket(tripId: string) {
  const store = useTripStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('trip:join', tripId);

    // Itinerary events
    socket.on('itinerary:added', store.addItem);
    socket.on('itinerary:updated', store.updateItem);
    socket.on('itinerary:deleted', ({ id }: { id: string }) => store.deleteItem(id));
    socket.on('itinerary:reordered', store.reorderItems);

    // Chat events
    socket.on('chat:message', store.addMessage);
    socket.on('chat:typing', ({ userId, name, isTyping }: any) => {
      store.setTyping(userId, name, isTyping);
    });

    // Voting events
    socket.on('voting:suggestion_added', store.addSuggestion);
    socket.on('voting:updated', store.updateSuggestion);
    socket.on('voting:deleted', ({ id }: { id: string }) => store.deleteSuggestion(id));

    // Presence events
    socket.on('presence:online', (users: any[]) => store.setOnlineUsers(users));
    socket.on('presence:joined', store.addOnlineUser);
    socket.on('presence:left', ({ userId }: { userId: string }) =>
      store.removeOnlineUser(userId)
    );

    // Notifications
    socket.on('notification:new', store.addNotification);

    return () => {
      socket.emit('trip:leave', tripId);
      socket.off('itinerary:added');
      socket.off('itinerary:updated');
      socket.off('itinerary:deleted');
      socket.off('itinerary:reordered');
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('voting:suggestion_added');
      socket.off('voting:updated');
      socket.off('voting:deleted');
      socket.off('presence:online');
      socket.off('presence:joined');
      socket.off('presence:left');
      socket.off('notification:new');
    };
  }, [tripId]);
}
