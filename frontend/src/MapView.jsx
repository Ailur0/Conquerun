import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import axios from "axios";
import UserProfileModal from "./UserProfileModal";

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
    <div id="map-root" className="w-full h-screen flex flex-col">
      {notification && (
        <div id="notification-bar-1" className="bg-blue-500 text-white p-2 text-center">
          {notification}
        </div>
      )}
      <div id="map-container-wrapper-1" className="flex-1 relative">
        <MapContainer
          id="leaflet-map-container-1"
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full rounded-lg shadow-lg"
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
              return (
                <Polygon
                  key={t._id || i}
                  positions={t.geometry.coordinates[0].map(([lat, lng]) => [lat, lng])}
                  pathOptions={{ color: userColor(t.user, t.user === username), fillOpacity: 0.25 }}
                  id={`territory-polygon-${i}`}
                >
                  <Popup id={`territory-polygon-popup-${i}`}>{t.user} claimed this area</Popup>
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
        <div id="path-controls-bar-1" className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {!recording && (
            <button id="start-path-btn-1" className="bg-blue-600 text-white px-4 py-2 rounded shadow" onClick={handleStartPath} disabled={recording}>Start Path</button>
          )}
          {recording && (
            <button id="stop-path-btn-1" className="bg-yellow-600 text-white px-4 py-2 rounded shadow" onClick={handleStopPath}>Stop Path</button>
          )}
          {polygonReady && !claimLoading && (
            <button id="claim-area-btn-1" className="bg-green-600 text-white px-4 py-2 rounded shadow" onClick={handleClaimArea}>Claim Area</button>
          )}
        </div>
        <button
          id="claim-territory-btn-1"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg hover:bg-green-700 transition"
          onClick={handleClaim}
          disabled={claimLoading || !hasLocation}
        >
          {claimLoading ? "Claiming..." : "Claim Territory Here"}
        </button>
        {claimError && (
  <div id="claim-error-bar-1" className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-2">
    <span id="claim-error-msg-1">{claimError}</span>
    <button
      id="claim-error-dismiss-btn-1"
      className="ml-4 px-2 py-1 bg-white bg-opacity-20 rounded text-white hover:bg-opacity-40"
      onClick={() => setClaimError("")}
    >Dismiss</button>
  </div>
)}
      </div>
      <div id="leaderboard-container-1" className="bg-gray-100 p-2 shadow-inner">
        <h2 id="leaderboard-title-1" className="font-bold mb-1">Leaderboard</h2>
        <ul id="leaderboard-list-1">
          {leaderboard.map((entry, idx) => (
            <li
              key={entry._id}
              id={`leaderboard-entry-${idx}-1`}
              className={`cursor-pointer ${entry._id === username ? 'font-bold text-blue-700' : 'hover:underline'}`}
              onClick={() => handleLeaderboardClick(entry._id)}
            >
              {entry._id}: {entry.claims}
            </li>
          ))}
        </ul>
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
