import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';
import dynamic from 'next/dynamic';

interface VenueMapPickerProps {
  lat: string;
  lng: string;
  onLocationChange: (lat: string, lng: string) => void;
}

// Leaflet must be loaded client-side only
const MapComponent = dynamic(() => import('./MapInner'), { ssr: false });

export default function VenueMapPicker({ lat, lng, onLocationChange }: VenueMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        onLocationChange(
          parseFloat(data[0].lat).toFixed(6),
          parseFloat(data[0].lon).toFixed(6)
        );
      } else {
        setSearchError('Location not found. Try a different search term.');
      }
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const parsedLat = lat ? parseFloat(lat) : null;
  const parsedLng = lng ? parseFloat(lng) : null;
  const hasValidCoords = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search location (e.g., Mumbai, India)"
            className="form-input pl-9"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      {searchError && <p className="text-xs text-red-400">{searchError}</p>}

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-white border-opacity-10" style={{ height: 300 }}>
        <MapComponent
          lat={hasValidCoords ? parsedLat! : 20.5937}
          lng={hasValidCoords ? parsedLng! : 78.9629}
          zoom={hasValidCoords ? 14 : 5}
          hasMarker={hasValidCoords}
          onMapClick={(newLat: number, newLng: number) => {
            onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
          }}
        />
      </div>

      {/* Coordinates display */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Latitude</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => onLocationChange(e.target.value, lng)}
            placeholder="e.g., 20.5937"
            step="0.000001"
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Longitude</label>
          <input
            type="number"
            value={lng}
            onChange={(e) => onLocationChange(lat, e.target.value)}
            placeholder="e.g., 78.9629"
            step="0.000001"
            className="form-input"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400">Click on the map to set the venue location, or search by name above.</p>
    </div>
  );
}
