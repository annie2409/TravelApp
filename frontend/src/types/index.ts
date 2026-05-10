// src/types/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface TripMember {
  id: string;
  userId: string;
  tripId: string;
  role: 'OWNER' | 'EDITOR' | 'MEMBER';
  joinedAt: string;
  user: User;
}

export interface Trip {
  id: string;
  name: string;
  description?: string | null;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImage?: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  members: TripMember[];
  _count?: { itineraryItems: number; messages: number };
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  createdById: string;
  title: string;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  order: number;
  dayIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

export interface Message {
  id: string;
  tripId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Suggestion {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
  description?: string | null;
  score: number;
  createdAt: string;
  user: User;
  votes: { userId: string; value: number }[];
}

export interface Notification {
  id: string;
  userId: string;
  tripId?: string | null;
  type: 'ACTIVITY_ADDED' | 'ITINERARY_EDITED' | 'NEW_MESSAGE' | 'MEMBER_JOINED';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PresenceUser {
  userId: string;
  name: string;
  avatar?: string | null;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}
