import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { Map, LogOut as LogoutIcon, Settings } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onOpenSettings }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="glass-card safe-top border-0 border-b border-white/20 p-4 flex justify-between items-center z-20 backdrop-blur-glass">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Map className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Conquerun
        </h1>
      </div>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)} 
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label={`User menu for ${user.username}`}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          {user.username.charAt(0).toUpperCase()}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-72 glass-card rounded-2xl py-2 z-30 slide-up">
            <div className="px-4 py-3 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 border-b border-gray-200/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Total Points</div>
                  <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {user.totalPoints.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Territories</div>
                  <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {user.claimedTerritories}
                  </p>
                </div>
              </div>
            </div>
            <div className="py-1">
              <button
                onClick={onOpenSettings}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100/50 flex items-center transition-colors duration-150 rounded-lg mx-2"
              >
                <Settings className="w-5 h-5 mr-3 text-gray-500" />
                Settings
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 flex items-center transition-colors duration-150 rounded-lg mx-2"
              >
                <LogoutIcon className="w-5 h-5 mr-3 text-red-500" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
