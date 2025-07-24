import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export default function AuthForm({ onAuth, idPrefix }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const res = await axios.post(API_URL + endpoint, { username, password });
      if (mode === "login") {
        onAuth(res.data.token, res.data.username);
      } else {
        setMode("login");
        setError("Registration successful! Please log in.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={idPrefix + "-auth-form-container"} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <form id={idPrefix + "-auth-form"} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs" onSubmit={handleSubmit}>
        <h2 id={idPrefix + "-auth-title"} className="text-xl font-bold mb-4 text-center">{mode === "login" ? "Login" : "Register"}</h2>
        {error && <div id={idPrefix + "-auth-error"} className="text-red-500 text-sm mb-2 text-center">{error}</div>}
        <div className="mb-3">
          <label htmlFor={idPrefix + "-username-input"} className="block mb-1 font-medium">Username</label>
          <input
            id={idPrefix + "-username-input"}
            className="w-full border rounded px-2 py-1"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label htmlFor={idPrefix + "-password-input"} className="block mb-1 font-medium">Password</label>
          <input
            id={idPrefix + "-password-input"}
            className="w-full border rounded px-2 py-1"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          id={idPrefix + "-auth-submit-btn"}
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>
        <div className="mt-3 text-center">
          <button
            id={idPrefix + "-auth-switch-btn"}
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
