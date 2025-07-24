import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
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
  // hash to color palette
  const colors = ["#f59e42", "#10b981", "#e11d48", "#fbbf24", "#6366f1", "#14b8a6", "#7c3aed", "#fb7185", "#84cc16", "#f472b6"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MapView({ token, username }) {
  const [position, setPosition] = useState([51.505, -0.09]); // Default: London
  const [hasLocation, setHasLocation] = useState(false);
  const [territories, setTerritories] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notification, setNotification] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [profileUser, setProfileUser] = useState(null);
  const [profileTerritories, setProfileTerritories] = useState([]);

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
      setTimeout(() => setNotification(""), 3000);
    });
    socket.on("leaderboardUpdate", (data) => {
      setLeaderboard(data);
    });
    // Initial fetch
    axios.get(API_URL).then(res => setTerritories(res.data));
    axios.get(API_URL + "/leaderboard").then(res => setLeaderboard(res.data));
    return () => socket.disconnect();
  }, []);

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
      // Success: real-time update will be handled by socket.io
    } catch (err) {
      setClaimError(err.response?.data?.error || "Claim failed");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleLeaderboardClick = async (user) => {
    setProfileUser(user);
    // Fetch user's claimed territories
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
          {territories.map((t, i) => (
            <CircleMarker
              key={t._id || i}
              center={[t.latitude, t.longitude]}
              radius={12}
              pathOptions={{ color: userColor(t.user, t.user === username), fillOpacity: 0.5 }}
              id={`territory-circle-marker-${i}`}
            >
              <Popup id={`territory-popup-${i}-1`}>
                {t.user} claimed here
              </Popup>
            </CircleMarker>
          ))}
          {profileUser && profileTerritories.map((t, i) => (
            <CircleMarker
              key={t._id || i + "-profile"}
              center={[t.latitude, t.longitude]}
              radius={15}
              pathOptions={{ color: t.user === username ? '#2563eb' : '#f59e42', fillOpacity: 0.3 }}
              id={`profile-highlight-marker-${i}`}
            />
          ))}
        </MapContainer>
        <button
          id="claim-territory-btn-1"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg hover:bg-green-700 transition"
          onClick={handleClaim}
          disabled={claimLoading || !hasLocation}
        >
          {claimLoading ? "Claiming..." : "Claim Territory Here"}
        </button>
        {claimError && (
          <div id="claim-error-1" className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow">
            {claimError}
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
