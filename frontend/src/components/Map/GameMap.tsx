import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Territory } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';

import { socket } from '../../services/socket';
import { useToast } from '../UI/Toast';
import { isPointNearPolygon, haversine } from '../../utils/geo';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  territories: Territory[];
  setTerritories: React.Dispatch<React.SetStateAction<Territory[]>>;
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

interface OtherPlayer {
  userId: string;
  username: string;
  lat: number;
  lng: number;
  timestamp?: number;
}

export const GameMap: React.FC<GameMapProps> = ({
  territories,
  setTerritories,
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

  const { showToast } = useToast();
  // Track last location/time for speed check
  const lastMoveRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  const [mapCenter, setMapCenter] = useState<LatLngExpression>([40.7829, -73.9654]); // NYC default
  const [mapZoom, setMapZoom] = useState(16);
  const mapRef = useRef<any>(null);

  // Track other players' positions
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
  const userId = window.localStorage.getItem('userId') || Math.random().toString(36).slice(2, 10); // fallback for demo
  const username = window.localStorage.getItem('username') || 'Player_' + userId;

  // Emit player-move on location update
  useEffect(() => {
    if (location && isPlaying) {
      setMapCenter([location.lat, location.lng]);
      onLocationUpdate(location.lat, location.lng);
      socket.emit('player-move', {
        userId,
        username,
        lat: location.lat,
        lng: location.lng,
        timestamp: Date.now(),
      });
    }
  }, [location, onLocationUpdate, isPlaying]);

  // Listen for other players' moves
  useEffect(() => {
    function handlePlayerMove(data: OtherPlayer) {
      setOtherPlayers(prev => {
        // Replace or add the player by userId
        const others = prev.filter(p => p.userId !== data.userId);
        return [...others, data];
      });
    }
    socket.on('player-move', handlePlayerMove);
    return () => {
      socket.off('player-move', handlePlayerMove);
    };
  }, []);

  // Listen for territory-contested events and update territories in real time
  useEffect(() => {
    function handleTerritoryContested(data: { id: string; owner: string }) {
      setTerritories((prev: Territory[]) => prev.map((t: Territory) =>
        t.id === data.id ? { ...t, ownerId: data.owner } : t
      ));
    }
    socket.on('territory-contested', handleTerritoryContested);
    return () => {
      socket.off('territory-contested', handleTerritoryContested);
    };
  }, [setTerritories]);

  // Animate claimed territory
  const [recentlyClaimedId, setRecentlyClaimedId] = useState<string | null>(null);

  const handleClaimTerritory = () => {
    if (currentPath.length < 4) return;
    if (!location) {
      showToast('Location not available', 'error');
      return;
    }
    if (!isPointNearPolygon(location.lat, location.lng, currentPath, 20)) {
      showToast('You must be inside your drawn area to claim!', 'info');
      return;
    }
    // Optionally: check polygon area, self-intersection, etc.
    // Call parent claim logic
    onTerritoryAttempt();
    // Find new territory (after parent updates state)
    setTimeout(() => {
      const latest = territories[territories.length - 1];
      if (latest) {
        setRecentlyClaimedId(latest.id);
        setTimeout(() => setRecentlyClaimedId(null), 2000);
      }
    }, 100);
    showToast('Territory claimed!', 'success');
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

        {/* Other players */}
        {otherPlayers.filter(p => p.userId !== userId).map((p) => (
          <React.Fragment key={p.userId}>
            <Circle
              center={[p.lat, p.lng]}
              radius={12}
              fillColor="#F59E42"
              fillOpacity={0.5}
              color="#F59E42"
              weight={2}
            />
            {/* Username label */}
            <div
              style={{
                position: 'absolute',
                left: `calc(50% + ${(p.lng - location.lng) * 8000}px)`, // crude projection
                top: `calc(50% + ${(p.lat - location.lat) * -8000}px)`,
                pointerEvents: 'none',
                fontWeight: 600,
                color: '#F59E42',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: 12,
                zIndex: 1000,
                transform: 'translate(-50%, -170%)',
                whiteSpace: 'nowrap',
              }}
            >
              {p.username}
            </div>
          </React.Fragment>
        ))}

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
        {territories.map((territory) => {
          const isOwner = territory.ownerId === userId;
          const isRecent = territory.id === recentlyClaimedId;
          return (
            <React.Fragment key={territory.id}>
              <Polygon
                positions={territory.coordinates}
                color={territory.color}
                weight={isRecent ? 6 : 2}
                fillColor={territory.color}
                fillOpacity={isRecent ? 0.6 : 0.3}
                pathOptions={isRecent ? { className: 'animate-pulse-polygon' } : {}}
              />
              {/* Contest button for non-owned territories */}
              {!isOwner && isPlaying && location && isPointNearPolygon(location.lat, location.lng, territory.coordinates, 20) && (
                <button
                  className="absolute z-20 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full shadow-lg text-xs font-bold"
                  style={{ left: '50%', top: '85%', transform: 'translate(-50%, 0)' }}
                  onClick={async () => {
                    // Speed check (client-side, basic)
                    const now = Date.now();
                    const last = lastMoveRef.current;
                    let speed = 0;
                    if (last) {
                      const dist = haversine(last.lat, last.lng, location.lat, location.lng);
                      const dt = (now - last.timestamp) / 1000;
                      speed = dt > 0 ? dist / dt : 0;
                      if (speed > 15) {
                        showToast('Speed too high, move slower!', 'error');
                        return;
                      }
                    }
                    lastMoveRef.current = { lat: location.lat, lng: location.lng, timestamp: now };
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`/api/territories/${territory.id}/contest`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ lat: location.lat, lng: location.lng }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        showToast(data.error || 'Failed to contest territory', 'error');
                      } else {
                        showToast('Territory contested!', 'success');
                      }
                    } catch (e) {
                      showToast('Error contesting territory', 'error');
                    }
                  }}
                >
                  Contest
                </button>
              )}
              {/* If not near, show info toast on click attempt */}
              {!isOwner && isPlaying && location && !isPointNearPolygon(location.lat, location.lng, territory.coordinates, 20) && (
                <button
                  className="absolute z-20 bg-gray-400 text-white px-3 py-1 rounded-full shadow-lg text-xs font-bold opacity-70 cursor-not-allowed"
                  style={{ left: '50%', top: '85%', transform: 'translate(-50%, 0)' }}
                  onClick={() => showToast('You must be inside the territory to contest', 'info')}
                  disabled
                >
                  Contest
                </button>
              )}
            </React.Fragment>
          );
        })}
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