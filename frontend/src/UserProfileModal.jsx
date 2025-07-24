import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

export default function UserProfileModal({ username, onClose, idPrefix }) {
  const [profile, setProfile] = useState(null);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      axios.get(`${API_URL}/${username}/profile`).then(res => res.data),
      axios.get(`${API_URL}/${username}/territories`).then(res => res.data),
    ])
      .then(([profileData, territoriesData]) => {
        if (isMounted) {
          setProfile(profileData);
          setTerritories(territoriesData);
        }
      })
      .catch(err => {
        if (isMounted) setError(err.response?.data?.error || "Error loading profile");
      })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [username]);

  return (
    <div id={idPrefix + "-user-modal-bg"} className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div id={idPrefix + "-user-modal"} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          id={idPrefix + "-modal-close-btn"}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl font-bold"
          onClick={onClose}
        >&times;</button>
        {loading ? (
          <div id={idPrefix + "-profile-loading"} className="text-center">Loading...</div>
        ) : error ? (
          <div id={idPrefix + "-profile-error"} className="text-red-500 text-center">{error}</div>
        ) : (
          <>
            <h2 id={idPrefix + "-profile-title"} className="text-xl font-bold mb-2 text-center">{profile.username}</h2>
            <div id={idPrefix + "-profile-claims"} className="mb-4 text-center">Total Claims: {profile.claimCount}</div>
            <div id={idPrefix + "-profile-territories-title"} className="font-semibold mb-2">Claimed Territories:</div>
            <ul id={idPrefix + "-profile-territories-list"} className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
              {territories.length === 0 ? (
                <li id={idPrefix + "-no-territories"} className="text-gray-400">No territories claimed yet.</li>
              ) : (
                territories.map((t, i) => (
                  <li key={t._id || i} id={idPrefix + "-territory-" + i}>
                    Lat: {t.latitude.toFixed(5)}, Lng: {t.longitude.toFixed(5)}, Claimed: {new Date(t.claimedAt).toLocaleString()}
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
