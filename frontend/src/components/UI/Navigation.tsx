import React from 'react';
import { Map, Trophy } from 'lucide-react';

type NavTab = 'game' | 'leaderboard';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, className = '' }) => {
  const tabs: { id: NavTab; name: string; icon: React.ElementType }[] = [
    { id: 'game', name: 'Game', icon: Map },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className={`bg-white/80 backdrop-blur-sm shadow-t-lg fixed bottom-0 left-0 right-0 z-20 ${className}`}>
      <div className="flex justify-around max-w-2xl mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-500'
                : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            <tab.icon className="h-5 w-5 mb-1" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};