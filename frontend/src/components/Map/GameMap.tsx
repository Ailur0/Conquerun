import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Circle, CircleMarker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { MapPinOff, Minus, Plus, LocateFixed } from 'lucide-react';
import { Territory, User } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';

import { socket } from '../../services/socket';
import { ApiTerritory, ContestedTerritoryEvent, toTerritory } from '../../services/gameService';
import { useToast } from '../UI/Toast';
import { isPointNearPolygon, haversine } from '../../utils/geo';
import { estimateClaim, MIN_CLAIM_AREA_SQ_METERS } from '../../utils/geospatial';
import 'leaflet/dist/leaflet.css';

interface GameMapProps {
  currentUser: User;
  territories: Territory[];
  setTerritories: React.Dispatch<React.SetStateAction<Territory[]>>;
  currentPath: [number, number][];
  onLocationUpdate: (lat: number, lng: number) => void;
  onTerritoryAttempt: () => Promise<Territory | null>;
  onTerritoryContest: (territoryId: string, lat: number, lng: number) => Promise<{ success: boolean; territory?: Territory; error?: string }>;
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

const DEFAULT_ZOOM = 17;
const MIN_ZOOM = 12;
const MAX_ZOOM = 19;

interface OtherPlayer {
  userId: string;
  username: string;
  lat: number;
  lng: number;
  timestamp?: number;
}

export const GameMap: React.FC<GameMapProps> = ({
  currentUser,
  territories,
  setTerritories,
  currentPath,
  onLocationUpdate,
  onTerritoryAttempt,
  onTerritoryContest,
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

  // Null until the first location fix, so the map opens on the player rather than a default city
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null);
  // Street level: territories are tens of meters across
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const hasCenteredRef = useRef(false);

  // Track other players' positions
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);
  const { id: userId, username } = currentUser;

  // Center on the first fix; while playing, follow the player and emit player-move
  useEffect(() => {
    if (location && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      setMapCenter([location.lat, location.lng]);
    }
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
  }, [location, onLocationUpdate, isPlaying, userId, username]);

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
    function handleTerritoryContested(data: ContestedTerritoryEvent) {
      // Replace the whole territory so owner name and color follow the new owner
      const territory = toTerritory(data);
      setTerritories(prev => prev.some(t => t.id === territory.id)
        ? prev.map(t => t.id === territory.id ? territory : t)
        : [...prev, territory]
      );
    }
    socket.on('territory-contested', handleTerritoryContested);
    return () => {
      socket.off('territory-contested', handleTerritoryContested);
    };
  }, [setTerritories]);

  // Add territories claimed by any player (including our own claim, if the HTTP response hasn't added it yet)
  useEffect(() => {
    function handleTerritoryClaimed(data: ApiTerritory) {
      const territory = toTerritory(data);
      setTerritories(prev => prev.some(t => t.id === territory.id) ? prev : [...prev, territory]);
    }
    socket.on('territory-claimed', handleTerritoryClaimed);
    return () => {
      socket.off('territory-claimed', handleTerritoryClaimed);
    };
  }, [setTerritories]);

  // Animate claimed territory
  const [recentlyClaimedId, setRecentlyClaimedId] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimTerritory = async () => {
    if (currentPath.length < 4 || isClaiming) return;
    if (!location) {
      showToast('Location not available', 'error');
      return;
    }
    if (!isPointNearPolygon(location.lat, location.lng, currentPath, 20)) {
      showToast('You must be inside your drawn area to claim!', 'info');
      return;
    }
    setIsClaiming(true);
    try {
      // Parent submits the claim; on failure it surfaces the error in the game overlay
      const territory = await onTerritoryAttempt();
      if (territory) {
        setRecentlyClaimedId(territory.id);
        setTimeout(() => setRecentlyClaimedId(null), 2000);
        showToast(`Territory claimed! +${territory.points} points`, 'success');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const [isContesting, setIsContesting] = useState(false);

  const handleContestTerritory = async (territory: Territory) => {
    if (!location || isContesting) return;
    // Speed check (client-side, basic)
    const now = Date.now();
    const last = lastMoveRef.current;
    if (last) {
      const dist = haversine(last.lat, last.lng, location.lat, location.lng);
      const dt = (now - last.timestamp) / 1000;
      const speed = dt > 0 ? dist / dt : 0;
      if (speed > 15) {
        showToast('Speed too high, move slower!', 'error');
        return;
      }
    }
    lastMoveRef.current = { lat: location.lat, lng: location.lng, timestamp: now };
    setIsContesting(true);
    try {
      const result = await onTerritoryContest(territory.id, location.lat, location.lng);
      if (result.success && result.territory) {
        setRecentlyClaimedId(result.territory.id);
        setTimeout(() => setRecentlyClaimedId(null), 2000);
        showToast(`Territory taken from ${territory.ownerUsername}! +${result.territory.points} points`, 'success');
      } else {
        showToast(result.error || 'Failed to contest territory', 'error');
      }
    } finally {
      setIsContesting(false);
    }
  };

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-6 max-w-sm" role="alert">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-100 flex items-center justify-center">
            <MapPinOff className="w-6 h-6 text-red-600" aria-hidden />
          </div>
          <div className="text-gray-900 text-lg font-semibold mb-1">We can't see your location</div>
          <div className="text-gray-600 text-sm">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            Conquerun needs location access to track your path. Allow it in your browser's site settings, then try again.
          </div>
          <button onClick={() => window.location.reload()} className="btn-secondary mt-4 py-2 text-sm">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !location) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-6" role="status">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-700 font-medium">Finding your location...</div>
          <div className="text-xs text-gray-500 mt-1">Allow location access if your browser asks.</div>
        </div>
      </div>
    );
  }

  // Another player's territory the user is standing in (or within 20m of), if any
  const contestableTerritory = isPlaying
    ? territories.find(t => t.ownerId !== userId && isPointNearPolygon(location.lat, location.lng, t.coordinates, 20))
    : undefined;
  // Only offer claiming once the loop meets the backend's minimum area
  const claimEstimate = estimateClaim(currentPath);
  const canClaim = currentPath.length >= 4 && claimEstimate.area >= MIN_CLAIM_AREA_SQ_METERS;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter ?? [location.lat, location.lng]}
        zoom={mapZoom}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={MAX_ZOOM}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {mapCenter && <MapUpdater center={mapCenter} zoom={mapZoom} />}
        <MapEvents onLocationUpdate={onLocationUpdate} />

        {/* User location: accuracy halo plus a fixed-size dot that stays visible at any zoom */}
        <Circle
          center={[location.lat, location.lng]}
          radius={location.accuracy || 10}
          fillColor="#3B82F6"
          fillOpacity={0.15}
          color="#3B82F6"
          weight={1}
          interactive={false}
        />
        <CircleMarker
          center={[location.lat, location.lng]}
          radius={8}
          fillColor="#2563EB"
          fillOpacity={1}
          color="#FFFFFF"
          weight={3}
          interactive={false}
        />

        {/* Other players */}
        {otherPlayers.filter(p => p.userId !== userId).map((p) => (
          <Circle
            key={p.userId}
            center={[p.lat, p.lng]}
            radius={12}
            fillColor="#F59E42"
            fillOpacity={0.5}
            color="#F59E42"
            weight={2}
          >
            {/* Anchored to the marker, so it stays put when zooming or panning */}
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {p.username}
            </Tooltip>
          </Circle>
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
          const isRecent = territory.id === recentlyClaimedId;
          const isOwn = territory.ownerId === userId;
          return (
            <Polygon
              key={territory.id}
              positions={territory.coordinates}
              color={territory.color}
              weight={isRecent ? 6 : isOwn ? 3 : 2}
              fillColor={territory.color}
              fillOpacity={isRecent ? 0.6 : 0.3}
              pathOptions={isRecent ? { className: 'animate-pulse-polygon' } : {}}
            >
              {/* Padding keeps the popup clear of the GPS chip (top-left) and map buttons (right) */}
              <Popup autoPanPaddingTopLeft={[12, 60]} autoPanPaddingBottomRight={[64, 12]}>
                <div className="w-44">
                  <div className="font-bold text-gray-900 text-sm">
                    {isOwn ? 'Your territory' : `${territory.ownerUsername}'s territory`}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                    <div><span className="font-semibold text-gray-800">{territory.points.toLocaleString()}</span> points</div>
                    <div>{Math.round(territory.area).toLocaleString()} m²</div>
                    <div>Claimed {territory.claimedAt.toLocaleDateString()}</div>
                  </div>
                  {!isOwn && (
                    <div className="mt-2 text-xs text-gray-500">Stand inside it during a game to contest it.</div>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Contest and claim buttons, stacked so both stay visible */}
      {isPlaying && (contestableTerritory || canClaim) && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2 w-max max-w-[calc(100%-2rem)]">
          {contestableTerritory && (
            <button
              onClick={() => handleContestTerritory(contestableTerritory)}
              disabled={isContesting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm px-5 py-2.5 rounded-full shadow-lg font-semibold truncate max-w-full transition-all duration-200 active:scale-95"
            >
              {isContesting ? 'Contesting...' : `Contest ${contestableTerritory.ownerUsername}'s Territory`}
            </button>
          )}
          {canClaim && (
            <button
              onClick={handleClaimTerritory}
              disabled={isClaiming}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 disabled:cursor-wait text-white text-sm px-5 py-2.5 rounded-full shadow-xl ring-4 ring-orange-300/50 font-semibold whitespace-nowrap transition-all duration-200 active:scale-95"
            >
              {isClaiming ? 'Claiming...' : `Claim Territory · ~${claimEstimate.points} pts`}
            </button>
          )}
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          onClick={() => setMapZoom(prev => Math.min(prev + 1, MAX_ZOOM))}
          className="bg-white shadow-lg rounded-xl w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMapZoom(prev => Math.max(prev - 1, MIN_ZOOM))}
          className="bg-white shadow-lg rounded-xl w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setMapCenter([location.lat, location.lng]);
            setMapZoom(DEFAULT_ZOOM);
          }}
          className="bg-white shadow-lg rounded-xl w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-gray-50 transition-colors"
          aria-label="Center map on my location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Location accuracy indicator */}
      <div className="absolute top-3 left-3 z-10 bg-white shadow-lg rounded-xl px-3 py-2 text-xs" title="GPS accuracy">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${location.accuracy < 10 ? 'bg-green-500' : location.accuracy < 50 ? 'bg-yellow-500' : 'bg-red-500'}`} aria-hidden></div>
          <span className="text-gray-700 font-medium">GPS ±{Math.round(location.accuracy)} m</span>
        </div>
      </div>
    </div>
  );
};