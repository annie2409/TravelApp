'use client';
// src/components/map/PlaceSearch.tsx
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { PlaceResult } from '@/types';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places'],
});

interface Props {
  onSelect: (place: PlaceResult) => void;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function PlaceSearch({ onSelect, value, onChange, placeholder = 'Search for a place...' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    initAutocomplete();
  }, []);

  const initAutocomplete = async () => {
    try {
      await loader.load();
      if (!inputRef.current) return;

      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current!.getPlace();
        if (!place.geometry?.location) return;

        const result: PlaceResult = {
          placeId: place.place_id || '',
          name: place.name || '',
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onSelect(result);
        onChange(place.formatted_address || place.name || '');
      });
    } catch (e) {
      console.error('Places autocomplete failed', e);
    }
  };

  return (
    <input
      ref={inputRef}
      className="input"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      autoComplete="off"
    />
  );
}
