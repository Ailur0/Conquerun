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
    <div id={idPrefix + "-user-modal-bg"} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        id={idPrefix + "-user-modal"} 
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 scale-100 animate-modal-enter"
      >
        {/* Close Button */}
        <button
          id={idPrefix + "-modal-close-btn"}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div id={idPrefix + "-profile-loading"} className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        ) : error ? (
          <div id={idPrefix + "-profile-error"} className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 id={idPrefix + "-profile-title"} className="text-2xl font-bold text-gray-800 mb-2">
                {profile.username}
              </h2>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2 inline-block">
                <span className="text-blue-800 font-semibold">
                  {profile.claimCount} claim{profile.claimCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Territories Section */}
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 id={idPrefix + "-profile-territories-title"} className="font-semibold text-gray-800">
                  Claimed Territories
                </h3>
              </div>
              
              <div id={idPrefix + "-profile-territories-container"} className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 custom-scrollbar">
                {territories.length === 0 ? (
                  <div id={idPrefix + "-no-territories"} className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p>No territories claimed yet</p>
                  </div>
                ) : (
                  <ul id={idPrefix + "-profile-territories-list"} className="divide-y divide-gray-100">
                    {territories.map((t, i) => {
                      // Check if it's a polygon or point
                      const isPolygon = t.geometry && t.geometry.type === 'Polygon';
                      const lat = isPolygon ? t.geometry.coordinates[0][0][0] : (t.geometry ? t.geometry.coordinates[1] : t.latitude);
                      const lng = isPolygon ? t.geometry.coordinates[0][0][1] : (t.geometry ? t.geometry.coordinates[0] : t.longitude);
                      
                      return (
                        <li key={t._id || i} id={idPrefix + "-territory-" + i} className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isPolygon ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {isPolygon ? 'Area' : 'Point'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(t.claimedAt).toLocaleDateString()} at {new Date(t.claimedAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
