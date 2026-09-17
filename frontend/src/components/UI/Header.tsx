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
    if (!dropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <header className="glass-card safe-top border-0 border-b border-white/20 px-4 py-3 flex justify-between items-center z-20 backdrop-blur-glass">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Map className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Conquerun
        </h1>
      </div>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-2xl bg-white/70 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label={`Account menu for ${user.username}`}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <span className="text-sm font-bold text-blue-700 tabular-nums">
            {user.totalPoints.toLocaleString()} <span className="font-medium text-gray-500">pts</span>
          </span>
          <span className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </button>

        {dropdownOpen && (
          <div role="menu" className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-30 slide-up">
            <div className="px-4 py-3 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 border-b border-gray-200/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Total Points</div>
                  <p className="text-xl font-bold text-blue-700">
                    {user.totalPoints.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Territories</div>
                  <p className="text-xl font-bold text-green-700">
                    {user.claimedTerritories}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-2 pt-1">
              <button
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-100/70 flex items-center transition-colors duration-150 rounded-lg"
              >
                <Settings className="w-5 h-5 mr-3 text-gray-500" />
                Settings
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50/70 flex items-center transition-colors duration-150 rounded-lg"
              >
                <LogoutIcon className="w-5 h-5 mr-3 text-red-500" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
