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
      description: 'Collaborate with friends',
      icon: Users,
      color: 'green',
      disabled: true,
    },
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap = {
      blue: {
        bg: isSelected ? 'bg-blue-50' : 'bg-gray-50',
        border: isSelected ? 'border-blue-500' : 'border-transparent',
        icon: isSelected ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-400',
        radio: 'bg-blue-500'
      },
      orange: {
        bg: isSelected ? 'bg-orange-50' : 'bg-gray-50',
        border: isSelected ? 'border-orange-500' : 'border-transparent',
        icon: isSelected ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gray-400',
        radio: 'bg-orange-500'
      },
      green: {
        bg: isSelected ? 'bg-green-50' : 'bg-gray-50',
        border: isSelected ? 'border-green-500' : 'border-transparent',
        icon: isSelected ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gray-400',
        radio: 'bg-green-500'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`card-elevated p-6 fade-in ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Your Adventure</h3>
        <p className="text-gray-600 text-sm">Select a game mode to start conquering territories</p>
      </div>
      
      <div className="space-y-3" role="radiogroup" aria-label="Game mode">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const colors = getColorClasses(mode.color, isSelected);

          return (
            <button
              key={mode.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => !mode.disabled && onModeChange(mode.id)}
              disabled={mode.disabled}
              className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                colors.bg
              } border-2 ${colors.border} ${
                mode.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md active:scale-[0.98]'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${colors.icon}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <span className="font-bold text-gray-900 whitespace-nowrap">{mode.name}</span>
                    {mode.disabled && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">{mode.description}</div>
                </div>
                <div className="flex items-center">
                  {isSelected ? (
                    <div className={`w-5 h-5 rounded-full ${colors.radio} flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={onStartGame}
          className="btn-primary w-full text-lg py-4"
        >
          🎮 Start {modes.find(m => m.id === selectedMode)?.name}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Walk a loop around an area, then claim it. Bigger loops earn more points.
        </p>
      </div>
    </div>
  );
};