import { useState, useEffect } from 'react';
import MapView from './MapView';
import AuthForm from './AuthForm';
import './App.css';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('jwtToken') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

  const handleAuth = (jwt, user) => {
    setToken(jwt);
    setUsername(user);
    localStorage.setItem('jwtToken', jwt);
    localStorage.setItem('username', user);
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
  };

  return (
    <div id="app-root" className="w-full h-screen flex flex-col">
      <div id="app-header" className="bg-gray-900 text-white p-2 flex items-center justify-between">
        <span id="app-title" className="font-bold text-lg">Conquerun</span>
        {username ? (
          <div id="user-info" className="flex items-center gap-2">
            <span id="user-greeting">Hello, {username}</span>
            <button
              id="logout-btn"
              className="bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-700"
              onClick={handleLogout}
            >Logout</button>
          </div>
        ) : null}
      </div>
      <div id="app-main-content" className="flex-1">
        {token ? (
          <MapView token={token} username={username} />
        ) : (
          <AuthForm onAuth={handleAuth} idPrefix="main" />
        )}
      </div>
    </div>
  );
}

export default App;
