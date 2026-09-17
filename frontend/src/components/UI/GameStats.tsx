import React from 'react';
import { User, GameSession } from '../../types';
import { Trophy, MapPin, Target, Flag } from 'lucide-react';

interface GameStatsProps {
  user: User;
  session: GameSession | null;
  className?: string;
}

export const GameStats: React.FC<GameStatsProps> = ({ user, session, className = '' }) => {
  const inSession = !!session && session.isActive;

  return (
    <div className={`bg-white shadow-lg rounded-2xl p-4 border border-gray-100 ${className}`}>
      <div className={`grid gap-3 ${inSession ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-blue-600" aria-hidden />
            <span className="text-xs font-medium text-gray-600">Total Points</span>
          </div>
          <div className="text-lg font-bold text-blue-700 tabular-nums">
            {user.totalPoints.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-green-600" aria-hidden />
            <span className="text-xs font-medium text-gray-600">Territories</span>
          </div>
          <div className="text-lg font-bold text-green-700 tabular-nums">
            {user.claimedTerritories}
          </div>
        </div>

        {inSession && (
          <>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-orange-600" aria-hidden />
                <span className="text-xs font-medium text-gray-600">Session Points</span>
              </div>
              <div className="text-lg font-bold text-orange-700 tabular-nums">
                {session.score.toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Flag className="w-4 h-4 text-purple-600" aria-hidden />
                <span className="text-xs font-medium text-gray-600">Session Claims</span>
              </div>
              <div className="text-lg font-bold text-purple-700 tabular-nums">
                {session.territoriesClaimed}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
