import React from 'react';
import { User } from '../../types';
import { MapPin, Trophy, Calendar, LogOut, Settings } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, className = '' }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const achievements = [
    { name: 'First Steps', description: 'Claimed your first territory', icon: '🎯', unlocked: true },
    { name: 'Explorer', description: 'Claimed 5 territories', icon: '🗺️', unlocked: user.claimedTerritories >= 5 },
    { name: 'Conqueror', description: 'Earned 1000 points', icon: '👑', unlocked: user.totalPoints >= 1000 },
    { name: 'Speed Walker', description: 'Complete a territory in under 5 minutes', icon: '⚡', unlocked: false },
  ];

  return (
    <div className={`bg-white shadow-lg rounded-2xl p-6 ${className}`}>
      {/* Profile Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
        <p className="text-gray-600">{user.email}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-500">Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">{user.totalPoints.toLocaleString()}</div>
          <div className="text-sm text-blue-600">Total Points</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
          <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-700">{user.claimedTerritories}</div>
          <div className="text-sm text-green-600">Territories</div>
        </div>
      </div>

      {/* Member Since */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div>
            <div className="text-sm text-gray-600">Member since</div>
            <div className="font-semibold text-gray-900">{formatDate(user.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
        <div className="space-y-3">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border transition-all ${
                achievement.unlocked
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className={`font-semibold ${achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'}`}>
                    {achievement.name}
                  </div>
                  <div className={`text-sm ${achievement.unlocked ? 'text-yellow-700' : 'text-gray-500'}`}>
                    {achievement.description}
                  </div>
                </div>
                {achievement.unlocked && (
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Settings</span>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-600" />
          <span className="text-red-700 font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};