/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { audio } from './game/audio';
import { gamepadManager } from './game/gamepad';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { VictoryModal } from './components/VictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { ControlsModal } from './components/ControlsModal';
import { VirtualControls } from './components/VirtualControls';
import { Gamepad2 } from 'lucide-react';

export default function App() {
  // Initialize engine cleanly with useState without ref mutation during render
  const [engine] = useState(() => new GameEngine());

  // React state synced from engine for UI rendering
  const [phase, setPhase] = useState(engine.phase);
  const [playerHealth, setPlayerHealth] = useState(engine.player.health);
  const [playerSoul, setPlayerSoul] = useState(engine.player.soul);
  const [isFocusing, setIsFocusing] = useState(engine.player.isFocusing);
  const [bossPhase, setBossPhase] = useState<1 | 2>(1);
  const [bossHealth, setBossHealth] = useState(engine.lord0.health);
  const [bossMaxHealth, setBossMaxHealth] = useState(engine.lord0.maxHealth);
  const [bossName, setBossName] = useState(engine.lord0.name);

  // UI Modals & Inputs
  const [isPaused, setIsPaused] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Gamepad State & Toast
  const [gamepadConnected, setGamepadConnected] = useState(gamepadManager.isConnected);
  const [gamepadName, setGamepadName] = useState(gamepadManager.gamepadName);
  const [gamepadToast, setGamepadToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Sync modal open state to engine to prevent accidental game starts
  useEffect(() => {
    engine.isModalOpen = isControlsOpen || isPaused;
  }, [engine, isControlsOpen, isPaused]);

  // Sync state from engine tick without unnecessary re-renders
  const syncState = useCallback(() => {
    setPhase((prev) => (prev !== engine.phase ? engine.phase : prev));
    setPlayerHealth((prev) => (prev !== engine.player.health ? engine.player.health : prev));
    setPlayerSoul((prev) => (prev !== engine.player.soul ? engine.player.soul : prev));
    setIsFocusing((prev) => (prev !== engine.player.isFocusing ? engine.player.isFocusing : prev));

    if (engine.phase === 'PHASE_2') {
      setBossPhase((prev) => (prev !== 2 ? 2 : prev));
      const totalCurrent = Math.max(0, engine.lord1.health) + Math.max(0, engine.lord2.health);
      const totalMax = engine.lord1.maxHealth + engine.lord2.maxHealth;
      setBossHealth((prev) => (prev !== totalCurrent ? totalCurrent : prev));
      setBossMaxHealth((prev) => (prev !== totalMax ? totalMax : prev));
      setBossName((prev) => (prev !== 'Sœurs de Bataille' ? 'Sœurs de Bataille' : prev));
    } else {
      setBossPhase((prev) => (prev !== 1 ? 1 : prev));
      const lord0Health = Math.max(0, engine.lord0.health);
      setBossHealth((prev) => (prev !== lord0Health ? lord0Health : prev));
      setBossMaxHealth((prev) => (prev !== engine.lord0.maxHealth ? engine.lord0.maxHealth : prev));
      setBossName((prev) => (prev !== engine.lord0.name ? engine.lord0.name : prev));
    }
  }, [engine]);

  // Hook pause toggle
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Sync audio pause state
  useEffect(() => {
    audio.setPaused(isPaused);
  }, [isPaused]);

  // Handlers
  const handleStart = useCallback(() => {
    setIsPaused(false);
    engine.startGame();
    syncState();
  }, [engine, syncState]);

  const handleRestart = useCallback(() => {
    setIsPaused(false);
    engine.restart();
    syncState();
  }, [engine, syncState]);

  const handleTitle = useCallback(() => {
    setIsPaused(false);
    engine.goToTitle();
    syncState();
  }, [engine, syncState]);

  useEffect(() => {
    engine.onStateChange = syncState;
    engine.onPauseRequest = handleTogglePause;
    engine.onMenuAction = (action) => {
      if (action === 'confirm') {
        handleRestart();
      } else if (action === 'cancel') {
        handleTitle();
      }
    };

    // Heartbeat sync for HUD values (e.g. smooth soul gain and focus channel)
    const interval = setInterval(syncState, 100);
    return () => clearInterval(interval);
  }, [engine, syncState, handleTogglePause, handleRestart, handleTitle]);

  // Gamepad Connection Listener
  useEffect(() => {
    const unsub = gamepadManager.onConnectionChange((connected, name) => {
      setGamepadConnected(connected);
      setGamepadName(name);

      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }

      setGamepadToast(connected ? `🎮 ${name || 'Manette'} connectée !` : '🎮 Manette déconnectée');

      toastTimerRef.current = window.setTimeout(() => {
        setGamepadToast(null);
        toastTimerRef.current = null;
      }, 3500);
    });

    return () => {
      unsub();
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Handle auto-detecting touch screens
  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setShowTouchControls(true);
    }
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMuted(nextMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audio.setVolume(newVol);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040711] select-none font-sans flex items-center justify-center">
      {/* 16:9 Aspect Ratio Canvas Viewport */}
      <GameCanvas
        engine={engine}
        isPaused={isPaused}
        isModalOpen={isControlsOpen || isPaused}
        onPauseToggle={handleTogglePause}
      />

      {/* Title Screen Overlay */}
      {phase === 'TITLE' && (
        <TitleScreen
          onStart={handleStart}
          isMuted={isMuted}
          gamepadConnected={gamepadConnected}
          gamepadName={gamepadName}
          onToggleMute={handleToggleMute}
          onOpenControls={() => setIsControlsOpen(true)}
        />
      )}

      {/* Combat HUD Overlay */}
      {phase !== 'TITLE' && (
        <HUD
          health={playerHealth}
          soul={playerSoul}
          isFocusing={isFocusing}
          bossPhase={bossPhase}
          bossHealth={bossHealth}
          bossMaxHealth={bossMaxHealth}
          bossName={bossName}
          isMuted={isMuted}
          isPaused={isPaused}
          gamepadConnected={gamepadConnected}
          gamepadName={gamepadName}
          gamepadToast={gamepadToast}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
          onOpenControls={() => setIsControlsOpen(true)}
        />
      )}

      {/* Virtual On-Screen Controls (for Mobile & Tablet) */}
      {showTouchControls && phase !== 'TITLE' && !isPaused && (
        <VirtualControls engine={engine} />
      )}

      {/* Touch Controls Toggle Button (bottom-right desktop toggle) */}
      {phase !== 'TITLE' && (
        <button
          onClick={() => setShowTouchControls((prev) => !prev)}
          className="absolute bottom-3 right-3 z-30 p-2 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition hidden sm:flex items-center gap-1.5 text-[11px] font-cinzel cursor-pointer"
          title="Afficher/Masquer les contrôles tactiles"
        >
          <Gamepad2 size={14} />
          <span>{showTouchControls ? 'Masquer Boutons' : 'Boutons Tactiles'}</span>
        </button>
      )}

      {/* Victory Modal */}
      {phase === 'VICTORY' && (
        <VictoryModal
          stats={engine.stats}
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}

      {/* Game Over Modal */}
      {phase === 'GAMEOVER' && (
        <GameOverModal
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}

      {/* Pause Modal */}
      <PauseModal
        isOpen={isPaused}
        isMuted={isMuted}
        volume={volume}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        onTitle={handleTitle}
        onToggleMute={handleToggleMute}
        onVolumeChange={handleVolumeChange}
      />

      {/* Controls & Combat Guide Modal */}
      <ControlsModal
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
      />
    </div>
  );
}
