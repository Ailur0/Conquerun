import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export default function MapView() {
  const [position, setPosition] = useState([51.505, -0.09]); // Default: London
  const [hasLocation, setHasLocation] = useState(false);
  const [territories, setTerritories] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notification, setNotification] = useState("");

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
    return () => socket.disconnect();
  }, []);

  return (
    <div id="map-root" className="w-full h-screen flex flex-col">
      {notification && (
        <div id="notification-bar" className="bg-blue-500 text-white p-2 text-center">
          {notification}
        </div>
      )}
      <div id="map-container-wrapper" className="flex-1">
        <MapContainer
          id="leaflet-map-container"
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full rounded-lg shadow-lg"
        >
          <TileLayer
            id="tile-layer-osm"
            attribution="&copy; <a href='https://osm.org/copyright'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasLocation && (
            <Marker position={position} id="user-location-marker">
              <Popup id="user-location-popup">You are here</Popup>
            </Marker>
          )}
          {territories.map((t, i) => (
            <Marker key={t._id || i} position={[t.latitude, t.longitude]} id={`territory-marker-${i}`}>
              <Popup id={`territory-popup-${i}`}>{t.user} claimed here</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div id="leaderboard-container" className="bg-gray-100 p-2 shadow-inner">
        <h2 id="leaderboard-title" className="font-bold mb-1">Leaderboard</h2>
        <ul id="leaderboard-list">
          {leaderboard.map((entry, idx) => (
            <li key={entry._id} id={`leaderboard-entry-${idx}`}>{entry._id}: {entry.claims}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
