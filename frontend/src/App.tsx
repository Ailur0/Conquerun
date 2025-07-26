import { useState, useEffect } from 'react';
import { GameMap } from './components/Map/GameMap';
import { AuthModal } from './components/Auth/AuthModal';
import { GameStats } from './components/UI/GameStats';
import { GameModeSelector } from './components/UI/GameModeSelector';
import { GameOverlay } from './components/UI/GameOverlay';
import { Leaderboard } from './components/UI/Leaderboard';
import { Navigation } from './components/UI/Navigation';
import { authService } from './services/authService';
import { gameService } from './services/gameService';
import { User, GameMode, Territory, GameSession } from './types';
import Header from './components/UI/Header';
import { SettingsPage } from './pages/SettingsPage';
import { ToastProvider } from './components/UI/Toast';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<User[]>([]);
  
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
        setTerritories(gameService.getTerritories());
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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (activeTab === 'leaderboard' && currentUser) {
        const users = await authService.getLeaderboard();
        setLeaderboardData(users);
      }
    };

    fetchLeaderboard();
  }, [activeTab, currentUser]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-gray-900 animate-pulse">🗺️ Loading Conquerun...</h1>
      </div>
    );
  }

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
      <Header user={currentUser} onLogout={handleLogout} onOpenSettings={() => setSettingsOpen(true)} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'game' && (
           <div className="flex flex-col h-full">
             {/* Game Map - Top part */}
             <div className="h-[45vh]">
               <GameMap
                 territories={territories}
                 setTerritories={setTerritories}
                 currentPath={currentPath}
                 onLocationUpdate={handleLocationUpdate}
                 onTerritoryAttempt={handleTerritoryAttempt}
                 isPlaying={isPlaying}
                 className="h-full"
               />
             </div>

             {/* Game UI - Bottom part */}
             <div className="flex-1 p-4 bg-gray-100 overflow-y-auto">
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
        )}

        {activeTab === 'leaderboard' && (
          <div className="flex-1 p-4">
            <Leaderboard users={leaderboardData} currentUser={currentUser} />
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