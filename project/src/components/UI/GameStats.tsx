import React from 'react';
import { User, GameSession } from '../../types';
import { Trophy, MapPin, Clock, Target } from 'lucide-react';

interface GameStatsProps {
  user: User;
  session: GameSession | null;
  className?: string;
}

export const GameStats: React.FC<GameStatsProps> = ({ user, session, className = '' }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white shadow-lg rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.username}</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
        
        {session && session.isActive && (
          <div className="text-right">
            <div className="text-xs text-gray-500">Session Time</div>
            <div className="font-mono text-sm font-semibold text-blue-600">
              {formatTime(session.startTime)}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-600">Total Points</span>
          </div>
          <div className="text-lg font-bold text-blue-700">
            {user.totalPoints.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600">Territories</span>
          </div>
          <div className="text-lg font-bold text-green-700">
            {user.claimedTerritories}
          </div>
        </div>

        {session && session.isActive && (
          <>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-gray-600">Session Score</span>
              </div>
              <div className="text-lg font-bold text-orange-700">
                {session.score}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600">Claimed Today</span>
              </div>
              <div className="text-lg font-bold text-purple-700">
                {session.territoriesClaimed}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};