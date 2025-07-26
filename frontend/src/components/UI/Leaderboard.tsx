import React from 'react';
import { User } from '../../types';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  currentUser: User;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser, className = '' }) => {
  const sortedUsers = [...users].sort((a, b) => b.totalPoints - a.totalPoints);
  const currentUserRank = sortedUsers.findIndex(u => u.id === currentUser.id) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className={`bg-white shadow-lg rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
        <div className="text-sm text-gray-500">
          Your rank: #{currentUserRank}
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {sortedUsers.slice(0, 10).map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = user.id === currentUser.id;
          
          return (
            <div
              key={user.id}
              className={`p-3 rounded-xl border transition-all duration-200 ${
                isCurrentUser 
                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                  : getRankBg(rank)
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(rank)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                      {user.username}
                    </span>
                    {user.isOnline && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.claimedTerritories} territories claimed
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                    {user.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserRank > 10 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                <span className="text-sm font-bold text-blue-600">#{currentUserRank}</span>
              </div>
              
              <div className="flex-1">
                <div className="font-semibold text-blue-900">{currentUser.username}</div>
                <div className="text-sm text-blue-700">
                  {currentUser.claimedTerritories} territories claimed
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-bold text-blue-700">
                  {currentUser.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600">points</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};