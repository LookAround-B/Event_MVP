import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FiSearch, FiMapPin } from 'react-icons/fi';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

interface AddressComponents {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface AddressMapPickerProps {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  onAddressChange: (components: AddressComponents) => void;
}

export default function AddressMapPicker({ address, city, state, country, pincode, onAddressChange }: AddressMapPickerProps) {
  const [lat, setLat] = useState('20.5937');
  const [lng, setLng] = useState('78.9629');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const reverseGeocode = useCallback(async (latitude: string, longitude: string) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await resp.json();
      if (data?.address) {
        const a = data.address;
        const road = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ');
        onAddressChange({
          address: road || data.display_name?.split(',').slice(0, 3).join(',') || '',
          city: a.city || a.town || a.village || a.county || '',
          state: a.state || '',
          country: a.country || '',
          pincode: a.postcode || '',
        });
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
  }, [onAddressChange]);

  const handleMapClick = useCallback((clickLat: number, clickLng: number) => {
    const latStr = clickLat.toFixed(6);
    const lngStr = clickLng.toFixed(6);
    setLat(latStr);
    setLng(lngStr);
    reverseGeocode(latStr, lngStr);
  }, [reverseGeocode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await resp.json();
      if (results.length > 0) {
        const r = results[0];
        setLat(r.lat);
        setLng(r.lon);
        const a = r.address || {};
        const road = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ');
        onAddressChange({
          address: road || r.display_name?.split(',').slice(0, 3).join(',') || '',
          city: a.city || a.town || a.village || a.county || '',
          state: a.state || '',
          country: a.country || '',
          pincode: a.postcode || '',
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition"
      >
        <FiMapPin className="w-4 h-4" />
        {showMap ? 'Hide Map' : 'Pick from Map'}
      </button>

      {showMap && (
        <div className="glass p-4 rounded-xl space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              placeholder="Search location..."
              className="flex-1 form-input text-sm"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="px-3 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition disabled:opacity-50"
            >
              <FiSearch className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 rounded-lg overflow-hidden">
            <MapInner
              lat={parseFloat(lat) || 20.5937}
              lng={parseFloat(lng) || 78.9629}
              zoom={5}
              hasMarker={true}
              onMapClick={handleMapClick}
            />
          </div>
          <p className="text-xs text-gray-400">Click on the map to auto-fill the address fields.</p>
        </div>
      )}
    </div>
  );
}
