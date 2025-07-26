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
    <header className="bg-white shadow-md p-4 flex justify-between items-center z-20">
      <div className="flex items-center space-x-2">
        <Map className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-800">Conquerun</h1>
      </div>
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          {user.username.charAt(0).toUpperCase()}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-30 ring-1 ring-black ring-opacity-5">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-semibold text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="px-4 py-3 border-b">
                <div className="text-xs text-gray-500">Total Points</div>
                <p className="text-lg font-bold text-gray-800">{user.totalPoints}</p>
                <div className="text-xs text-gray-500 mt-2">Territories Claimed</div>
                <p className="text-lg font-bold text-gray-800">{user.claimedTerritories}</p>
            </div>
            <button
              onClick={onOpenSettings}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <LogoutIcon className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
