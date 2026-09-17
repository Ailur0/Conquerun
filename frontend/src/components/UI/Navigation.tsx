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
    <nav aria-label="Main" className={`glass-card border-0 border-t border-white/20 safe-bottom left-0 right-0 z-20 ${className}`}>
      <div className="flex justify-around max-w-2xl mx-auto px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center py-2.5 px-2 text-xs font-semibold transition-colors duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-500'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-100'
                  : 'hover:bg-gray-100'
              }`}>
                <tab.icon className="h-6 w-6" aria-hidden />
              </div>
              <span className={`mt-1 transition-all duration-200 ${
                isActive ? 'font-bold' : ''
              }`}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};