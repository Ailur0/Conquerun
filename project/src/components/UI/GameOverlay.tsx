import React, { useState, useEffect } from 'react';
import { GameSession } from '../../types';
import { Play, Pause, Square, AlertTriangle } from 'lucide-react';

interface GameOverlayProps {
  session: GameSession | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onEndGame: () => void;
  currentPathLength: number;
  speedWarning?: boolean;
  error?: string;
  className?: string;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  session,
  isPlaying,
  onTogglePlay,
  onEndGame,
  currentPathLength,
  speedWarning,
  error,
  className = '',
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session && session.isActive && isPlaying) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (session?.mode === 'timed-challenge') {
      const remaining = 900 - timeElapsed; // 15 minutes
      if (remaining < 60) return 'text-red-600';
      if (remaining < 300) return 'text-orange-600';
    }
    return 'text-gray-700';
  };

  if (!session) return null;

  return (
    <div className={`${className}`}>
      {/* Main game controls */}
      <div className="bg-white shadow-lg rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isPlaying 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            
            <div>
              <div className="text-sm font-medium text-gray-600">
                {session.mode === 'free-play' && 'Free Play'}
                {session.mode === 'timed-challenge' && 'Timed Challenge'}
                {session.mode === 'team-mode' && 'Team Mode'}
              </div>
              <div className={`text-lg font-bold font-mono ${getTimerColor()}`}>
                {session.mode === 'timed-challenge' 
                  ? formatTime(Math.max(0, 900 - timeElapsed))
                  : formatTime(timeElapsed)
                }
              </div>
            </div>
          </div>

          <button
            onClick={onEndGame}
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Path progress */}
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Path Points</span>
            <span className="font-semibold text-gray-900">{currentPathLength}</span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentPathLength / 10) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Minimum 4 points needed to claim territory
          </div>
        </div>
      </div>

      {/* Warnings and alerts */}
      {(speedWarning || error) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-red-800">Safety Alert</div>
              <div className="text-sm text-red-700 mt-1">
                {speedWarning && "You're moving too fast! Please slow down for safety."}
                {error && error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {isPlaying && currentPathLength < 4 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">💡 Tip</div>
            Walk around an area to create a closed path, then claim your territory!
          </div>
        </div>
      )}
    </div>
  );
};