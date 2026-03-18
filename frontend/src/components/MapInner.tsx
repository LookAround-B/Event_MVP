import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapInnerProps {
  lat: number;
  lng: number;
  zoom: number;
  hasMarker: boolean;
  onMapClick: (lat: number, lng: number) => void;
}

// Fix default marker icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapInner({ lat, lng, zoom, hasMarker, onMapClick }: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Initialize map on first render
    if (!mapRef.current && containerRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add click handler
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map view and markers
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoom);

      // Remove existing marker
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Add new marker if needed
      if (hasMarker) {
        markerRef.current = L.marker([lat, lng], { icon: defaultIcon })
          .bindPopup('Event Venue')
          .addTo(mapRef.current);
      }
    }
  }, [lat, lng, zoom, hasMarker]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
