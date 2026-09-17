import React from 'react';
import { User } from '../../types';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';

interface LeaderboardProps {
  users: User[];
  currentUser: User;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const TOP_COUNT = 10;

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUser, isLoading = false, onRefresh, className = '' }) => {
  const sortedUsers = [...users].sort((a, b) => b.totalPoints - a.totalPoints);
  const currentUserRank = sortedUsers.findIndex(u => u.id === currentUser.id) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-white" aria-label="1st place" />;
      case 2:
        return <Medal className="w-5 h-5 text-white" aria-label="2nd place" />;
      case 3:
        return <Award className="w-5 h-5 text-white" aria-label="3rd place" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getMedalBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-500';
      default:
        return 'bg-gradient-to-br from-orange-400 to-orange-600';
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

  const renderRankBadge = () => {
    if (isLoading) return <span className="text-sm font-medium text-gray-500">Loading your rank...</span>;
    if (currentUserRank === 0) {
      return (
        <span className="text-sm font-medium text-gray-700">
          {currentUser.totalPoints === 0 ? 'Claim a territory to get ranked' : `Outside the top ${sortedUsers.length}`}
        </span>
      );
    }
    return <span className="text-sm font-medium text-gray-700">Your rank: #{currentUserRank}</span>;
  };

  return (
    <div className={`card-elevated p-5 sm:p-6 fade-in ${className}`}>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Global Leaderboard</h2>
        </div>
        <p className="text-gray-600 text-sm mb-4">Ranked by total points from territory you hold</p>
        <div className="inline-flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden></div>
            {renderRankBadge()}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50"
              aria-label="Refresh leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {isLoading && sortedUsers.length === 0 ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3" aria-hidden>🏁</div>
          <p className="font-semibold text-gray-800">No players on the board yet</p>
          <p className="text-sm text-gray-500 mt-1">Claim the first territory to take the top spot.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {sortedUsers.slice(0, TOP_COUNT).map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.id === currentUser.id;

            return (
              <li
                key={user.id || index}
                className={`p-3 sm:p-4 rounded-2xl border transition-shadow duration-200 hover:shadow-md ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 ring-2 ring-blue-200'
                    : getRankBg(rank)
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${rank <= 3 ? `${getMedalBg(rank)} shadow-md` : 'bg-gray-100'}`}>
                    {getRankIcon(rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-base sm:text-lg truncate ${
                        isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {user.username}
                      </span>
                      {isCurrentUser && (
                        <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.claimedTerritories} {user.claimedTerritories === 1 ? 'territory' : 'territories'}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg sm:text-xl font-bold tabular-nums ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                      {user.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">points</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {currentUserRank > TOP_COUNT && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-md slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">#{currentUserRank}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-lg text-blue-900 truncate">{currentUser.username}</span>
                  <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                    You
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  {currentUser.claimedTerritories} {currentUser.claimedTerritories === 1 ? 'territory' : 'territories'}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-blue-700 tabular-nums">
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
