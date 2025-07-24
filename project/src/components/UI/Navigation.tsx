import React from 'react';
import { Map, Trophy, User as UserIcon, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: 'game' | 'leaderboard' | 'profile';
  onTabChange: (tab: 'game' | 'leaderboard' | 'profile') => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, className = '' }) => {
  const tabs = [
    { id: 'game' as const, name: 'Game', icon: Map },
    { id: 'leaderboard' as const, name: 'Leaderboard', icon: Trophy },
    { id: 'profile' as const, name: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className={`bg-white shadow-lg rounded-t-2xl ${className}`}>
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.name}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};