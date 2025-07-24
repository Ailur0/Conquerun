import React, { useState, useEffect } from 'react';
import { GameMap } from './components/Map/GameMap';
import { AuthModal } from './components/Auth/AuthModal';
import { GameStats } from './components/UI/GameStats';
import { GameModeSelector } from './components/UI/GameModeSelector';
import { GameOverlay } from './components/UI/GameOverlay';
import { Leaderboard } from './components/UI/Leaderboard';
import { ProfileView } from './components/Profile/ProfileView';
import { Navigation } from './components/UI/Navigation';
import { authService } from './services/authService';
import { gameService } from './services/gameService';
import { User, GameMode, Territory, GameSession } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'profile'>('game');
  
  // Game state
  const [selectedMode, setSelectedMode] = useState<GameMode>('free-play');
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [speedWarning, setSpeedWarning] = useState(false);
  const [gameError, setGameError] = useState<string>('');
  
  // Load user on app start
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      setShowAuthModal(true);
    }
    
    // Load existing territories
    setTerritories(gameService.getTerritories());
  }, []);

  const handleAuth = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentSession(null);
    setIsPlaying(false);
    setShowAuthModal(true);
  };

  const handleStartGame = () => {
    if (!currentUser) return;
    
    const session = gameService.startSession(currentUser.id, selectedMode);
    setCurrentSession(session);
    setIsPlaying(true);
    setCurrentPath([]);
    setGameError('');
  };

  const handleEndGame = () => {
    const endedSession = gameService.endSession();
    setCurrentSession(null);
    setIsPlaying(false);
    setCurrentPath([]);
    gameService.clearCurrentPath();
    
    if (endedSession && currentUser) {
      // Update user stats
      const userTerritories = gameService.getUserTerritories(currentUser.id);
      const totalPoints = userTerritories.reduce((sum, t) => sum + t.points, 0);
      
      authService.updateUserStats(totalPoints - currentUser.totalPoints, userTerritories.length - currentUser.claimedTerritories);
      setCurrentUser(authService.getCurrentUser());
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setGameError('');
      setSpeedWarning(false);
    }
  };

  const handleLocationUpdate = (lat: number, lng: number) => {
    if (!currentUser || !isPlaying) return;

    const locationUpdate = {
      lat,
      lng,
      timestamp: new Date(),
      accuracy: 10, // Mock accuracy
    };

    const result = gameService.updateLocation(locationUpdate, currentUser.id);
    
    if (result.success) {
      setCurrentPath(result.path);
      setSpeedWarning(false);
      setGameError('');
    } else {
      if (result.speedWarning) {
        setSpeedWarning(true);
      }
      if (result.error) {
        setGameError(result.error);
      }
    }
  };

  const handleTerritoryAttempt = () => {
    if (!currentUser) return;

    const result = gameService.attemptTerritoryClaimByClosure(currentUser.id, currentUser.username);
    
    if (result.success && result.territory) {
      setTerritories(gameService.getTerritories());
      setCurrentPath([]);
      
      // Show success message (could be a toast notification)
      alert(`Territory claimed! You earned ${result.points} points!`);
      
      // Update user stats
      if (currentUser) {
        const updatedUser = { ...currentUser };
        updatedUser.totalPoints += result.points!;
        updatedUser.claimedTerritories += 1;
        setCurrentUser(updatedUser);
        authService.updateUserStats(result.points!, 1);
      }
    } else {
      setGameError(result.error || 'Failed to claim territory');
    }
  };

  const leaderboardUsers = authService.getLeaderboard();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🗺️ Conquerun</h1>
          <p className="text-gray-600 mb-8">Claim territories by walking in the real world</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
          >
            Get Started
          </button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {}}
          onAuth={handleAuth}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🗺️ Conquerun</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'game' && (
          <>
            {/* Game Map */}
            <div className="flex-1 relative">
              <GameMap
                territories={territories}
                currentPath={currentPath}
                onLocationUpdate={handleLocationUpdate}
                onTerritoryAttempt={handleTerritoryAttempt}
                isPlaying={isPlaying}
                className="h-full"
              />
            </div>

            {/* Game UI Overlay */}
            <div className="absolute top-20 left-4 right-4 z-10 pointer-events-none">
              <div className="pointer-events-auto">
                <GameStats user={currentUser} session={currentSession} className="mb-4" />
                
                {!currentSession && (
                  <GameModeSelector
                    selectedMode={selectedMode}
                    onModeChange={setSelectedMode}
                    onStartGame={handleStartGame}
                  />
                )}
                
                {currentSession && (
                  <GameOverlay
                    session={currentSession}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                    onEndGame={handleEndGame}
                    currentPathLength={currentPath.length}
                    speedWarning={speedWarning}
                    error={gameError}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div className="flex-1 p-4">
            <Leaderboard users={leaderboardUsers} currentUser={currentUser} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex-1 p-4">
            <ProfileView user={currentUser} onLogout={handleLogout} />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="sticky bottom-0"
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}

export default App;