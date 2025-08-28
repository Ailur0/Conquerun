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
  const [showTip, setShowTip] = useState(() => sessionStorage.getItem('tipDismissed') !== 'true');
  const [tipFading, setTipFading] = useState(false);

  useEffect(() => {
    if (!(isPlaying && currentPathLength < 4) || !showTip) return;
    setTipFading(false);
    const timeout = setTimeout(() => {
      setTipFading(true);
      setTimeout(() => {
        setShowTip(false);
        sessionStorage.setItem('tipDismissed', 'true');
      }, 500);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentPathLength, showTip]);

  useEffect(() => {
    let interval: number;
    
    if (session && session.isActive && isPlaying) {
      interval = window.setInterval(() => {
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
      <div className="card-elevated p-6 mb-4 fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onTogglePlay}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                isPlaying 
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
              aria-label={isPlaying ? 'Pause game' : 'Start playing'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-semibold text-gray-700">
                  {session.mode === 'free-play' && '🎮 Free Play'}
                  {session.mode === 'timed-challenge' && '⏱️ Timed Challenge'}
                  {session.mode === 'team-mode' && '👥 Team Mode'}
                </div>
                {isPlaying && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className={`text-2xl font-bold font-mono ${getTimerColor()} tracking-wider`}>
                {session.mode === 'timed-challenge' 
                  ? formatTime(Math.max(0, 900 - timeElapsed))
                  : formatTime(timeElapsed)
                }
              </div>
            </div>
          </div>

          <button
            onClick={onEndGame}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            aria-label="End game session"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>

        {/* Path progress */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Path Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{currentPathLength}</span>
              <span className="text-xs text-gray-500">/10</span>
            </div>
          </div>
          <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min((currentPathLength / 10) * 100, 100)}%` }}
            ></div>
            {currentPathLength >= 4 && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-600">
              {currentPathLength < 4 ? `${4 - currentPathLength} more points to claim` : 'Ready to claim territory! 🎉'}
            </div>
            {currentPathLength >= 4 && (
              <div className="text-xs font-medium text-green-600 animate-bounce">
                ✨ Claimable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warnings and alerts */}
      {(speedWarning || error) && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5 mb-4 slide-up">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-red-800 mb-1">⚠️ Safety Alert</div>
              <div className="text-sm text-red-700 leading-relaxed">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {isPlaying && currentPathLength < 4 && showTip && (
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 relative transition-all duration-500 ${tipFading ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-blue-800 mb-2 flex items-center justify-between">
                <span>Pro Tip</span>
                <button
                  className="w-6 h-6 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="Dismiss tip"
                  onClick={() => {
                    setTipFading(true);
                    setTimeout(() => {
                      setShowTip(false);
                      sessionStorage.setItem('tipDismissed', 'true');
                    }, 500);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-blue-700 leading-relaxed">
                Walk around an area to create a closed path, then claim your territory! 🚶‍♂️➡️🏆
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};