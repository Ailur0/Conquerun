import React from 'react';
import { GameMode } from '../../types';
import { Play, Clock, Users } from 'lucide-react';

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onStartGame: () => void;
  className?: string;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  onStartGame,
  className = '',
}) => {
  const modes = [
    {
      id: 'free-play' as GameMode,
      name: 'Free Play',
      description: 'Claim territories at your own pace',
      icon: Play,
      color: 'blue',
    },
    {
      id: 'timed-challenge' as GameMode,
      name: 'Timed Challenge',
      description: '15-minute territory claiming race',
      icon: Clock,
      color: 'orange',
    },
    {
      id: 'team-mode' as GameMode,
      name: 'Team Mode',
      description: 'Collaborate with friends (Coming Soon)',
      icon: Users,
      color: 'green',
      disabled: true,
    },
  ];

  return (
    <div className={`bg-white shadow-lg rounded-2xl p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Game Mode</h3>
      
      <div className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => !mode.disabled && onModeChange(mode.id)}
              disabled={mode.disabled}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                isSelected
                  ? `bg-${mode.color}-50 border-2 border-${mode.color}-500`
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              } ${mode.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? `bg-${mode.color}-500` : 'bg-gray-400'
                }`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{mode.name}</div>
                  <div className="text-sm text-gray-600">{mode.description}</div>
                </div>
                {isSelected && (
                  <div className={`w-4 h-4 rounded-full bg-${mode.color}-500`}>
                    <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onStartGame}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl mt-6 transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        Start Game
      </button>
    </div>
  );
};