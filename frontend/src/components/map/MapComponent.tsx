'use client';
// src/components/map/MapComponent.tsx
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ItineraryItem } from '@/types';

interface Props {
  items: ItineraryItem[];
  tripId: string;
}

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry'],
});

export default function MapComponent({ items }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);

  const locatedItems = items.filter(i => i.lat && i.lng);

  useEffect(() => {
    initMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) updateMarkers();
  }, [items]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      if (showRoute) drawRoute();
      else clearRoute();
    }
  }, [showRoute, items]);

  const initMap = async () => {
    try {
      await loader.load();
      if (!mapRef.current) return;

      const defaultCenter = locatedItems.length > 0
        ? { lat: locatedItems[0].lat!, lng: locatedItems[0].lng! }
        : { lat: 48.8566, lng: 2.3522 }; // Paris default

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        styles: darkMapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: { strokeColor: '#c5aa82', strokeWeight: 3 },
      });

      updateMarkers();
      setIsLoading(false);
    } catch (e) {
      console.error('Maps failed to load', e);
      setIsLoading(false);
    }
  };

  const updateMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (!mapInstanceRef.current) return;

    const bounds = new google.maps.LatLngBounds();

    locatedItems.forEach((item, idx) => {
      const position = { lat: item.lat!, lng: item.lng! };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        title: item.title,
        label: {
          text: String(idx + 1),
          color: '#0d0b09',
          fontWeight: 'bold',
          fontSize: '11px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#c5aa82',
          fillOpacity: 1,
          strokeColor: '#0d0b09',
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="background:#221e1a;color:#f5f4f2;padding:10px 12px;border-radius:8px;min-width:160px;font-family:sans-serif;">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${item.title}</div>
            ${item.location ? `<div style="font-size:11px;color:#ada69a;">${item.location}</div>` : ''}
            ${item.startTime ? `<div style="font-size:11px;color:#ada69a;margin-top:4px;">⏰ ${item.startTime}</div>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
        setSelectedItem(item);
      });

      markersRef.current.push(marker);
    });

    if (locatedItems.length > 0) {
      mapInstanceRef.current!.fitBounds(bounds, { padding: 60 });
    }
  };

  const drawRoute = async () => {
    if (locatedItems.length < 2 || !directionsRendererRef.current) return;

    const directionsService = new google.maps.DirectionsService();
    const waypoints = locatedItems.slice(1, -1).map(item => ({
      location: { lat: item.lat!, lng: item.lng! },
      stopover: true,
    }));

    const request: google.maps.DirectionsRequest = {
      origin: { lat: locatedItems[0].lat!, lng: locatedItems[0].lng! },
      destination: {
        lat: locatedItems[locatedItems.length - 1].lat!,
        lng: locatedItems[locatedItems.length - 1].lng!,
      },
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    };

    try {
      const result = await directionsService.route(request);
      directionsRendererRef.current.setDirections(result);
    } catch (e) {
      console.error('Directions failed', e);
    }
  };

  const clearRoute = () => {
    directionsRendererRef.current?.setDirections({ routes: [] } as any);
    updateMarkers();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Map</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {locatedItems.length} location{locatedItems.length !== 1 ? 's' : ''} mapped
          </p>
        </div>
        <div className="flex items-center gap-3">
          {locatedItems.length >= 2 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-[var(--text-secondary)]">Show route</span>
              <div
                onClick={() => setShowRoute(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors duration-200 ${showRoute ? 'bg-sand-500' : 'bg-ink-700'} relative`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ${showRoute ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)]" style={{ height: '520px' }}>
        {isLoading && (
          <div className="absolute inset-0 bg-[var(--bg-card)] flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-sand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {locatedItems.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-card)]/80 backdrop-blur-sm">
            <div className="text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sand-500 mx-auto mb-3">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p className="text-sm text-[var(--text-muted)]">Add activities with locations to see them on the map</p>
            </div>
          </div>
        )}
      </div>

      {/* Location list */}
      {locatedItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {locatedItems.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                mapInstanceRef.current?.panTo({ lat: item.lat!, lng: item.lng! });
                mapInstanceRef.current?.setZoom(15);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedItem?.id === item.id
                  ? 'border-sand-500 bg-sand-500/10'
                  : 'border-[var(--border)] hover:border-[var(--border-light)] bg-[var(--bg-card)]'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-sand-500 text-ink-950 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{item.location}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1714' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1714' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#ada69a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2520' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#221e1a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a342e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c2340' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#221e1a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5f5650' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2a1a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2520' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3a342e' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#5f5650' }] },
];
