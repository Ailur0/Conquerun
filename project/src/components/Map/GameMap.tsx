import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import { Territory } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { gameService } from '../../services/gameService';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  territories: Territory[];
  currentPath: [number, number][];
  onLocationUpdate: (lat: number, lng: number) => void;
  onTerritoryAttempt: () => void;
  isPlaying: boolean;
  className?: string;
}

const MapUpdater: React.FC<{ center: LatLngExpression; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
};

const MapEvents: React.FC<{ onLocationUpdate: (lat: number, lng: number) => void }> = ({ onLocationUpdate }) => {
  useMapEvents({
    locationfound: (e) => {
      onLocationUpdate(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

export const GameMap: React.FC<GameMapProps> = ({
  territories,
  currentPath,
  onLocationUpdate,
  onTerritoryAttempt,
  isPlaying,
  className = '',
}) => {
  const { location, error, isLoading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 2000,
  });

  const [mapCenter, setMapCenter] = useState<LatLngExpression>([40.7829, -73.9654]); // NYC default
  const [mapZoom, setMapZoom] = useState(16);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (location && isPlaying) {
      setMapCenter([location.lat, location.lng]);
      onLocationUpdate(location.lat, location.lng);
    }
  }, [location, onLocationUpdate, isPlaying]);

  const handleClaimTerritory = () => {
    if (currentPath.length >= 4) {
      onTerritoryAttempt();
    }
  };

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-6">
          <div className="text-red-500 text-lg font-semibold mb-2">Location Error</div>
          <div className="text-gray-600 text-sm">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            Please enable location services and refresh the page
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !location) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Getting your location...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full z-0"
        ref={mapRef}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <MapEvents onLocationUpdate={onLocationUpdate} />

        {/* User location */}
        <Circle
          center={[location.lat, location.lng]}
          radius={location.accuracy || 10}
          fillColor="#3B82F6"
          fillOpacity={0.2}
          color="#3B82F6"
          weight={2}
        />

        {/* User's current path */}
        {currentPath.length > 1 && (
          <Polyline
            positions={currentPath}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
            dashArray="10, 5"
          />
        )}

        {/* Claimed territories */}
        {territories.map((territory) => (
          <Polygon
            key={territory.id}
            positions={territory.coordinates}
            color={territory.color}
            weight={2}
            fillColor={territory.color}
            fillOpacity={0.3}
          />
        ))}
      </MapContainer>

      {/* Territory claim button */}
      {isPlaying && currentPath.length >= 4 && (
        <button
          onClick={handleClaimTerritory}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg font-semibold transition-all duration-200 animate-pulse"
        >
          Claim Territory
        </button>
      )}

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
          className="bg-white shadow-lg rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => setMapZoom(prev => Math.max(prev - 1, 10))}
          className="bg-white shadow-lg rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (location) {
              setMapCenter([location.lat, location.lng]);
              setMapZoom(16);
            }
          }}
          className="bg-white shadow-lg rounded-lg p-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Location accuracy indicator */}
      <div className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${location.accuracy < 10 ? 'bg-green-500' : location.accuracy < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-600">±{Math.round(location.accuracy)}m</span>
        </div>
      </div>
    </div>
  );
};