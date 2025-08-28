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
    <div className={`card-elevated p-6 fade-in ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-2xl font-bold text-gray-900">Global Leaderboard</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">Compete with players worldwide</p>
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Your rank: #{currentUserRank}</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedUsers.slice(0, 10).map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = user.id === currentUser.id;
          
          return (
            <div
              key={user.id || index}
              className={`p-4 rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                isCurrentUser 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 ring-2 ring-blue-200 shadow-md' 
                  : getRankBg(rank)
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-10 h-10">
                  {rank <= 3 ? (
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      {getRankIcon(rank)}
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>
                  )}
                  {rank <= 3 && (
                    <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl opacity-20 animate-pulse"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-lg ${
                      isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {user.username}
                    </span>
                    {user.isOnline && (
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
                      </div>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                        ✨ You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span>{user.claimedTerritories} territories claimed</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent' 
                      : rank <= 3
                        ? 'bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent'
                        : 'text-gray-900'
                  }`}>
                    {user.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">points</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserRank > 10 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-md slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">#{currentUserRank}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-blue-900">{currentUser.username}</span>
                  <span className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                    ✨ You
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>{currentUser.claimedTerritories} territories claimed</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {currentUser.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600 font-medium">points</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};