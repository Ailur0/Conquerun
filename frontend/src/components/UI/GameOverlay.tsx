import React, { useState, useEffect, useRef } from 'react';
import { GameSession } from '../../types';
import { Play, Pause, Square, AlertTriangle, Gauge, X } from 'lucide-react';
import { estimateClaim, MIN_CLAIM_AREA_SQ_METERS } from '../../utils/geospatial';

const TIMED_CHALLENGE_SECONDS = 15 * 60;

interface GameOverlayProps {
  session: GameSession | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onEndGame: (reason?: 'time-up') => void;
  currentPath: [number, number][];
  speedWarning?: boolean;
  error?: string;
  onDismissError: () => void;
  className?: string;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  session,
  isPlaying,
  onTogglePlay,
  onEndGame,
  currentPath,
  speedWarning,
  error,
  onDismissError,
  className = '',
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [showTip, setShowTip] = useState(() => sessionStorage.getItem('tipDismissed') !== 'true');
  const endedForTimeRef = useRef(false);

  const dismissTip = () => {
    setShowTip(false);
    sessionStorage.setItem('tipDismissed', 'true');
  };

  // The session clock is wall time: it keeps running while tracking is paused
  useEffect(() => {
    if (!session || !session.isActive) return;
    const tick = () => setTimeElapsed(Math.floor((Date.now() - session.startTime.getTime()) / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const isTimed = session?.mode === 'timed-challenge';
  const remaining = Math.max(0, TIMED_CHALLENGE_SECONDS - timeElapsed);

  useEffect(() => {
    if (isTimed && remaining === 0 && !endedForTimeRef.current) {
      endedForTimeRef.current = true;
      onEndGame('time-up');
    }
  }, [isTimed, remaining, onEndGame]);

  // Ending a game throws away an unclaimed path, so ask for a second tap first
  useEffect(() => {
    if (!confirmingEnd) return;
    const timeout = window.setTimeout(() => setConfirmingEnd(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirmingEnd]);

  const handleEndClick = () => {
    if (currentPath.length > 0 && !confirmingEnd) {
      setConfirmingEnd(true);
      return;
    }
    onEndGame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isTimed) {
      if (remaining < 60) return 'text-red-600';
      if (remaining < 300) return 'text-orange-600';
    }
    return 'text-gray-800';
  };

  if (!session) return null;

  const { area, points } = estimateClaim(currentPath);
  const claimable = currentPath.length >= 4 && area >= MIN_CLAIM_AREA_SQ_METERS;
  const areaProgress = Math.min(area / MIN_CLAIM_AREA_SQ_METERS, 1);

  let pathStatus: string;
  if (!isPlaying) {
    pathStatus = 'Tracking is paused. Press play to keep recording your path.';
  } else if (currentPath.length === 0) {
    pathStatus = 'Start walking. Your path is recorded as you move.';
  } else if (!claimable) {
    pathStatus = `Keep walking around an area. You need ${MIN_CLAIM_AREA_SQ_METERS.toLocaleString()} m² to claim.`;
  } else {
    pathStatus = 'Big enough to claim! Claiming joins your position back to where you started.';
  }

  return (
    <div className={`${className}`}>
      {/* Main game controls */}
      <div className="card-elevated p-5 mb-4 fade-in">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={onTogglePlay}
              className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                isPlaying
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                  : 'bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
              aria-label={isPlaying ? 'Pause tracking' : 'Resume tracking'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-700 truncate mb-0.5">
                {session.mode === 'free-play' && '🎮 Free Play'}
                {session.mode === 'timed-challenge' && '⏱️ Timed Challenge'}
                {session.mode === 'team-mode' && '👥 Team Mode'}
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold font-mono ${getTimerColor()} tracking-wider tabular-nums`} aria-label={isTimed ? 'Time remaining' : 'Time elapsed'}>
                  {formatTime(isTimed ? remaining : timeElapsed)}
                </div>
                {isPlaying ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden></span>
                    Tracking
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Paused</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleEndClick}
            className={`h-12 flex-shrink-0 rounded-xl text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-lg ${
              confirmingEnd
                ? 'px-4 bg-red-600 hover:bg-red-700 animate-pulse'
                : 'w-12 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
            aria-label={confirmingEnd ? 'Tap again to end the game and discard your path' : 'End game'}
          >
            <Square className="w-5 h-5" />
            {confirmingEnd && <span className="text-sm font-semibold whitespace-nowrap">Tap to end</span>}
          </button>
        </div>
        {confirmingEnd && (
          <p className="-mt-2 mb-3 text-xs text-red-600 text-right">Your unclaimed path will be lost.</p>
        )}

        {/* Loop progress */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Loop size</span>
            <span className="text-sm text-gray-600 tabular-nums">
              <span className="text-lg font-bold text-gray-900">~{Math.round(area).toLocaleString()}</span>
              {claimable ? ' m²' : ` / ${MIN_CLAIM_AREA_SQ_METERS.toLocaleString()} m²`}
            </span>
          </div>
          <div
            className="relative bg-gray-200 rounded-full h-3 overflow-hidden"
            role="progressbar"
            aria-label="Loop size toward the minimum claim area"
            aria-valuemin={0}
            aria-valuemax={MIN_CLAIM_AREA_SQ_METERS}
            aria-valuenow={Math.round(Math.min(area, MIN_CLAIM_AREA_SQ_METERS))}
          >
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out ${claimable ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
              style={{ width: `${areaProgress * 100}%` }}
            ></div>
          </div>
          <div className="flex items-start justify-between gap-3 mt-2">
            <p className="text-xs text-gray-600 leading-relaxed">{pathStatus}</p>
            {claimable && (
              <span className="flex-shrink-0 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full tabular-nums">
                ~{points.toLocaleString()} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warnings and alerts */}
      {(speedWarning || error) && (
        <div
          role="alert"
          className={`border rounded-2xl p-4 mb-4 slide-up ${speedWarning ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${speedWarning ? 'bg-amber-100' : 'bg-red-100'}`}>
              {speedWarning
                ? <Gauge className="w-5 h-5 text-amber-700" aria-hidden />
                : <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden />}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold mb-0.5 ${speedWarning ? 'text-amber-900' : 'text-red-800'}`}>
                {speedWarning ? 'Slow down' : "Couldn't claim territory"}
              </div>
              <div className={`text-sm leading-relaxed ${speedWarning ? 'text-amber-800' : 'text-red-700'}`}>
                {error}
              </div>
            </div>
            <button
              onClick={onDismissError}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {isPlaying && currentPath.length < 4 && showTip && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 slide-up">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg" aria-hidden>💡</span>
            </div>
            <div className="flex-1">
              <div className="font-bold text-blue-800 mb-1">How to claim</div>
              <div className="text-sm text-blue-700 leading-relaxed">
                Walk around the area you want. When the loop is big enough, tap <strong>Claim Territory</strong> on the map. You must stay under 15 km/h.
              </div>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-all duration-200"
              aria-label="Dismiss tip"
              onClick={dismissTip}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
