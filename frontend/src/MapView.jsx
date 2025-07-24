import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import axios from "axios";
import UserProfileModal from "./UserProfileModal";
import * as turf from "@turf/turf";

const SOCKET_URL = "http://localhost:5000";
const API_URL = "http://localhost:5000/api/territories";
const USER_API_URL = "http://localhost:5000/api/users";

// Utility: assign a color to a username (consistent, readable)
function userColor(username, isSelf) {
  if (isSelf) return "#2563eb"; // blue for logged-in user
  const colors = ["#f59e42", "#10b981", "#e11d48", "#fbbf24", "#6366f1", "#14b8a6", "#7c3aed", "#fb7185", "#84cc16", "#f472b6"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function distance([lat1, lng1], [lat2, lng2]) {
  const R = 6371e3; // m
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function MapView({ token, username }) {
  const [position, setPosition] = useState([51.505, -0.09]);
  const [hasLocation, setHasLocation] = useState(false);
  const [territories, setTerritories] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notification, setNotification] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [profileTerritories, setProfileTerritories] = useState([]);
  const [animatedClaim, setAnimatedClaim] = useState(null);
  const [recording, setRecording] = useState(false);
  const [path, setPath] = useState([]);
  const [polygonReady, setPolygonReady] = useState(false);
  const pulseRef = useRef();
  const watchId = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setHasLocation(true);
        },
        () => setHasLocation(false),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on("territoryClaimed", (territory) => {
      setTerritories((prev) => [...prev, territory]);
      setNotification(`Territory claimed by ${territory.user}`);
      setAnimatedClaim({ ...territory, timestamp: Date.now() });
      setTimeout(() => setNotification(""), 3000);
    });
    socket.on("leaderboardUpdate", (data) => {
      setLeaderboard(data);
    });
    axios.get(API_URL).then(res => setTerritories(res.data));
    axios.get(API_URL + "/leaderboard").then(res => setLeaderboard(res.data));
    return () => socket.disconnect();
  }, []);

  // Animation effect: clear animatedClaim after 2.5s
  useEffect(() => {
    if (!animatedClaim) return;
    const timer = setTimeout(() => setAnimatedClaim(null), 2500);
    return () => clearTimeout(timer);
  }, [animatedClaim]);

  // Animation: pulse radius
  const [pulseRadius, setPulseRadius] = useState(12);
  useEffect(() => {
    if (!animatedClaim) return;
    let growing = true;
    pulseRef.current = setInterval(() => {
      setPulseRadius((r) => {
        if (growing && r < 30) return r + 2;
        if (!growing && r > 12) return r - 2;
        growing = !growing;
        return r;
      });
    }, 50);
    return () => clearInterval(pulseRef.current);
  }, [animatedClaim]);

  // Path recording logic
  useEffect(() => {
    if (!recording) {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const pt = [pos.coords.latitude, pos.coords.longitude];
          setPosition(pt);
          setHasLocation(true);
          setPath((prev) => {
            if (prev.length === 0 || distance(prev[prev.length-1], pt) > 5) {
              return [...prev, pt];
            }
            return prev;
          });
        },
        () => setHasLocation(false),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [recording]);

  // Detect if path can be closed (last point near first)
  useEffect(() => {
    if (path.length > 3 && distance(path[0], path[path.length-1]) < 20) {
      setPolygonReady(true);
    } else {
      setPolygonReady(false);
    }
  }, [path]);

  const handleStartPath = () => {
    setPath([]);
    setRecording(true);
  };
  const handleStopPath = () => {
    setRecording(false);
  };
  const handleClaimArea = async () => {
  setClaimLoading(true);
  setClaimError("");
  setRecording(false);
  try {
    // Close polygon by repeating first point
    const polygon = [...path, path[0]];
    await axios.post(
      API_URL + "/claim",
      { polygon },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPath([]);
  } catch (err) {
    if (err.response?.status === 409) {
      setClaimError("Polygon overlaps with another claimed area. Try a different region!");
    } else {
      setClaimError(err.response?.data?.error || "Polygon claim failed");
    }
  } finally {
    setClaimLoading(false);
  }
};

  const handleClaim = async () => {
    setClaimLoading(true);
    setClaimError("");
    try {
      const [latitude, longitude] = position;
      await axios.post(
        API_URL + "/claim",
        { latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      setClaimError(err.response?.data?.error || "Claim failed");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleLeaderboardClick = async (user) => {
    setProfileUser(user);
    try {
      const res = await axios.get(`${USER_API_URL}/${user}/territories`);
      setProfileTerritories(res.data);
    } catch {
      setProfileTerritories([]);
    }
  };

  const handleCloseProfile = () => {
    setProfileUser(null);
    setProfileTerritories([]);
  };

  return (
  <div id="map-root" className="w-full h-screen flex flex-col bg-gray-50">
    {/* Top notification bar */}
    {notification && (
      <div id="notification-bar-1" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 text-center font-medium shadow-md animate-pulse">
        <span id="notification-text-1">{notification}</span>
      </div>
    )}
    
    {/* Error notification */}
    {claimError && (
      <div id="claim-error-bar-1" className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in">
        <svg id="error-icon-1" className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span id="claim-error-msg-1" className="flex-1">{claimError}</span>
        <button
          id="claim-error-dismiss-btn-1"
          className="ml-2 px-3 py-1 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-colors font-medium text-sm"
          onClick={() => setClaimError("")}
        >
          Dismiss
        </button>
      </div>
    )}

    <div id="map-container-wrapper-1" className="flex-1 relative">
      <MapContainer
        id="leaflet-map-container-1"
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
          <TileLayer
            id="tile-layer-osm-1"
            attribution="&copy; <a href='https://osm.org/copyright'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasLocation && (
            <Marker position={position} id="user-location-marker-1">
              <Popup id="user-location-popup-1">You are here</Popup>
            </Marker>
          )}
          {/* Show all claimed territories as polygons or points */}
          {territories.map((t, i) => {
            if (t.geometry && t.geometry.type === 'Polygon') {
              // Calculate area (GeoJSON expects [lng, lat])
              let area = 0, formattedArea = '';
              try {
                const geojson = { type: 'Polygon', coordinates: t.geometry.coordinates };
                area = turf.area(geojson);
                formattedArea = area > 1000000
                  ? (area / 1000000).toFixed(2) + ' km²'
                  : Math.round(area).toLocaleString() + ' m²';
              } catch (e) { formattedArea = 'N/A'; }
              return (
                <Polygon
                  key={t._id || i}
                  positions={t.geometry.coordinates[0].map(([lat, lng]) => [lat, lng])}
                  pathOptions={{ color: userColor(t.user, t.user === username), fillOpacity: 0.25 }}
                  id={`territory-polygon-${i}`}
                >
                  <Popup id={`territory-polygon-popup-${i}`}>
                    <div id={`territory-polygon-popup-user-${i}`}>{t.user} claimed this area</div>
                    <div id={`territory-polygon-area-${i}`}>Area: <span id={`territory-area-span-${i}`}>{formattedArea}</span></div>
                  </Popup>
                </Polygon>
              );
            } else if (t.geometry && t.geometry.type === 'Point') {
              return (
                <CircleMarker
                  key={t._id || i}
                  center={[t.geometry.coordinates[1], t.geometry.coordinates[0]]}
                  radius={12}
                  pathOptions={{ color: userColor(t.user, t.user === username), fillOpacity: 0.5 }}
                  id={`territory-circle-marker-${i}`}
                >
                  <Popup id={`territory-popup-${i}-1`}>
                    {t.user} claimed here
                  </Popup>
                </CircleMarker>
              );
            }
            return null;
          })}
          {/* Animated pulse for the latest claim */}
          {animatedClaim && (
            <CircleMarker
              center={[animatedClaim.latitude, animatedClaim.longitude]}
              radius={pulseRadius}
              pathOptions={{ color: userColor(animatedClaim.user, animatedClaim.user === username), fillOpacity: 0.15, weight: 4 }}
              id="animated-claim-pulse"
            />
          )}
          {profileUser && profileTerritories.map((t, i) => (
            <CircleMarker
              key={t._id || i + "-profile"}
              center={[t.latitude, t.longitude]}
              radius={15}
              pathOptions={{ color: t.user === username ? '#2563eb' : '#f59e42', fillOpacity: 0.3 }}
              id={`profile-highlight-marker-${i}`}
            />
          ))}
          {/* Path polyline and polygon preview */}
          {path.length > 1 && (
            <Polyline positions={path} color="#2563eb" id="user-path-polyline-1" />
          )}
          {polygonReady && (
            <Polygon positions={path.concat([path[0]])} color="#2563eb" fillOpacity={0.2} id="user-path-polygon-1" />
          )}
        </MapContainer>
        
        {/* Path Controls - Top Center */}
        <div id="path-controls-bar-1" className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
          {!recording && (
            <button 
              id="start-path-btn-1" 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              onClick={handleStartPath} 
              disabled={recording}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Path
            </button>
          )}
          {recording && (
            <button 
              id="stop-path-btn-1" 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-5 py-2.5 rounded-lg shadow-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 animate-pulse"
              onClick={handleStopPath}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Path
            </button>
          )}
          {polygonReady && !claimLoading && (
            <button 
              id="claim-area-btn-1" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              onClick={handleClaimArea}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Claim Area
            </button>
          )}
        </div>
        
        {/* Territory Claim Button - Bottom Center */}
        <button
          id="claim-territory-btn-1"
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl shadow-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
          onClick={handleClaim}
          disabled={claimLoading || !hasLocation}
        >
          {claimLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Claiming...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Claim Territory Here
            </>
          )}
        </button>
                {claimError && (
          <div id="claim-error-bar-1" className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in">
            <svg id="error-icon-1" className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span id="claim-error-msg-1" className="flex-1">{claimError}</span>
            <button
              id="claim-error-dismiss-btn-1"
              className="ml-2 px-3 py-1 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-colors font-medium text-sm"
              onClick={() => setClaimError("")}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      
      {/* Enhanced Leaderboard */}
      <div id="leaderboard-container-1" className="bg-gradient-to-br from-white to-gray-50 p-4 shadow-lg border-t border-gray-200">
        <div id="leaderboard-header-1" className="flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h2 id="leaderboard-title-1" className="text-lg font-bold text-gray-800">Leaderboard</h2>
        </div>
        <div id="leaderboard-list-container-1" className="max-h-48 overflow-y-auto custom-scrollbar">
          {leaderboard.length === 0 ? (
            <div id="leaderboard-empty-1" className="text-center text-gray-500 py-4">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              No players yet
            </div>
          ) : (
            <ul id="leaderboard-list-1" className="space-y-2">
              {leaderboard.map((entry, idx) => {
                const isCurrentUser = entry._id === username;
                const isTopThree = idx < 3;
                const rankIcons = ['🥇', '🥈', '🥉'];
                
                return (
                  <li
                    key={entry._id}
                    id={`leaderboard-entry-${idx}-1`}
                    className={`
                      cursor-pointer rounded-lg p-3 transition-all duration-200 flex items-center justify-between
                      ${
                        isCurrentUser
                          ? 'bg-blue-100 border-2 border-blue-300 text-blue-800 font-bold transform scale-105'
                          : isTopThree
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                      }
                    `}
                    onClick={() => handleLeaderboardClick(entry._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {isTopThree ? rankIcons[idx] : idx + 1}
                      </div>
                      <div>
                        <div className={`font-medium ${isCurrentUser ? 'text-blue-800' : 'text-gray-800'}`}>
                          {entry._id} {isCurrentUser && '(You)'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.claims} claim{entry.claims !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      {profileUser && (
        <UserProfileModal
          username={profileUser}
          onClose={handleCloseProfile}
          idPrefix="profile"
        />
      )}
    </div>
  );
}
