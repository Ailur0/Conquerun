import { useState, useEffect, useCallback } from 'react';
import { GameMap } from './components/Map/GameMap';
import { AuthModal } from './components/Auth/AuthModal';
import { GameStats } from './components/UI/GameStats';
import { GameModeSelector } from './components/UI/GameModeSelector';
import { GameOverlay } from './components/UI/GameOverlay';
import { Leaderboard } from './components/UI/Leaderboard';
import { Navigation } from './components/UI/Navigation';
import { authService } from './services/authService';
import { gameService, ContestedTerritoryEvent } from './services/gameService';
import { socket } from './services/socket';
import { User, GameMode, Territory, GameSession } from './types';
import Header from './components/UI/Header';
import { SettingsPage } from './pages/SettingsPage';
import { ToastProvider, useToast } from './components/UI/Toast';

function App() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<User[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  
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
    const initializeApp = async () => {
      setIsLoadingApp(true);
      try {
        const user = await authService.fetchProfile();
        if (user) {
          setCurrentUser(user);
        } else {
          // Only show auth modal if there's no user from a valid token
          setShowAuthModal(true);
        }
        // Load existing territories
        setTerritories(await gameService.fetchTerritories());
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setShowAuthModal(true);
      } finally {
        setIsLoadingApp(false);
      }
    };

    initializeApp();
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

  const handleEndGame = (reason?: 'time-up') => {
    const endedSession = gameService.endSession();
    setCurrentSession(null);
    setIsPlaying(false);
    setCurrentPath([]);
    setGameError('');
    setSpeedWarning(false);
    gameService.clearCurrentPath();

    if (endedSession) {
      const claimed = endedSession.territoriesClaimed;
      const summary = claimed > 0
        ? `+${endedSession.score.toLocaleString()} points from ${claimed} ${claimed === 1 ? 'territory' : 'territories'}`
        : 'No territories claimed this time';
      showToast(`${reason === 'time-up' ? "Time's up!" : 'Game over.'} ${summary}.`, claimed > 0 ? 'success' : 'info');
    }
  };

  const handleDismissGameError = () => {
    setGameError('');
    setSpeedWarning(false);
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

    const result = gameService.updateLocation(locationUpdate);
    
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

  const handleTerritoryAttempt = async (): Promise<Territory | null> => {
    if (!currentUser) return null;

    const result = await gameService.attemptTerritoryClaimByClosure();

    if (result.success && result.territory) {
      const territory = result.territory;
      // The territory-claimed socket event may have already added it
      setTerritories(prev => prev.some(t => t.id === territory.id) ? prev : [...prev, territory]);
      setCurrentPath([]);
      setGameError('');

      // Stats were updated server-side; mirror the returned totals
      if (result.user) {
        const { totalPoints, claimedTerritories } = result.user;
        setCurrentUser(prev => prev && { ...prev, totalPoints, claimedTerritories });
      }
      return territory;
    }

    setGameError(result.error || 'Failed to claim territory');
    return null;
  };

  const handleTerritoryContest = async (territoryId: string, lat: number, lng: number) => {
    const result = await gameService.contestTerritory(territoryId, lat, lng);

    if (result.success && result.territory) {
      const territory = result.territory;
      setTerritories(prev => prev.map(t => t.id === territory.id ? territory : t));
      if (result.user) {
        const { totalPoints, claimedTerritories } = result.user;
        setCurrentUser(prev => prev && { ...prev, totalPoints, claimedTerritories });
      }
    }
    return result;
  };

  // When another player takes one of our territories, its points leave our totals
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (!currentUserId) return;
    function handleTerritoryContested(data: ContestedTerritoryEvent) {
      if (data.previousOwnerId !== currentUserId) return;
      setCurrentUser(prev => prev && {
        ...prev,
        totalPoints: prev.totalPoints - data.points,
        claimedTerritories: prev.claimedTerritories - 1,
      });
    }
    socket.on('territory-contested', handleTerritoryContested);
    return () => {
      socket.off('territory-contested', handleTerritoryContested);
    };
  }, [currentUserId]);

  const loadLeaderboard = useCallback(async () => {
    setIsLeaderboardLoading(true);
    const users = await authService.getLeaderboard();
    setLeaderboardData(users);
    setIsLeaderboardLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard' && currentUserId) {
      loadLeaderboard();
    }
  }, [activeTab, currentUserId, loadLeaderboard]);

  const handleUpdateUser = async (username: string) => {
    if (!currentUser) return { success: false, error: 'User not found' };
    const result = await authService.updateUserProfile(username);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return result;
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, error: 'User not found' };
    return await authService.changePassword(currentPassword, newPassword);
  };

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-2xl">
              🗺️
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-20 pulse-ring"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-shadow">Conquerun</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className="text-gray-600 mt-4">Preparing your adventure...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center p-8 max-w-md mx-auto fade-in">
          <div className="relative mb-8 w-24 h-24 mx-auto">
            {/* Ring sits behind the logo so it doesn't wash it out */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl opacity-20 pulse-ring" aria-hidden></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl text-white shadow-2xl bounce-in" aria-hidden>
              🗺️
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Conquerun</h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">Walk loops in the real world to claim territory on the map, then defend it from other players.</p>
          <div className="space-y-5">
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary w-full text-lg"
            >
              🚀 Get Started
            </button>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden></span>
                Real-time
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden></span>
                Multiplayer
              </li>
              <li className="flex items-center gap-2 whitespace-nowrap">
                <span className="w-2 h-2 bg-purple-500 rounded-full" aria-hidden></span>
                Location-based
              </li>
            </ul>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex flex-col">
      {/* Header */}
      <Header user={currentUser} onLogout={handleLogout} onOpenSettings={() => setSettingsOpen(true)} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'game' && (
           <div className="flex flex-col h-full">
             {/* Game Map - Top part */}
             <div className="h-[45vh]">
               <GameMap
                 currentUser={currentUser}
                 territories={territories}
                 setTerritories={setTerritories}
                 currentPath={currentPath}
                 onLocationUpdate={handleLocationUpdate}
                 onTerritoryAttempt={handleTerritoryAttempt}
                 onTerritoryContest={handleTerritoryContest}
                 isPlaying={isPlaying}
                 className="h-full"
               />
             </div>

             {/* Game UI - Bottom part */}
             <div className="flex-1 p-4 bg-gradient-to-t from-gray-100 to-gray-50 overflow-y-auto">
              <div className="mx-auto w-full max-w-2xl">
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
                   currentPath={currentPath}
                   speedWarning={speedWarning}
                   error={gameError}
                   onDismissError={handleDismissGameError}
                 />
               )}
              </div>
             </div>
           </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="flex-1 p-4 fade-in">
            <Leaderboard
              users={leaderboardData}
              currentUser={currentUser}
              isLoading={isLeaderboardLoading}
              onRefresh={loadLeaderboard}
              className="mx-auto w-full max-w-2xl"
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="sticky bottom-0"
      />

      {settingsOpen && currentUser && (
        <SettingsPage 
          user={currentUser} 
          onClose={() => setSettingsOpen(false)} 
          onUpdateUser={handleUpdateUser as (username: string) => Promise<{success: boolean, error?: string, user?: User}>} 
          onChangePassword={handleChangePassword as (currentPassword: string, newPassword: string) => Promise<{success: boolean, error?: string}>}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}

const AppWithToast = () => (
  <ToastProvider>
    <App />
  </ToastProvider>
);

export default AppWithToast;