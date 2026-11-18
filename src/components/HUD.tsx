/**
 * In-game HUD displaying Hollow Knight style Mask shards,
 * Soul Vessel, Boss Health Bar, and status indicators.
 */

import React from 'react';
import { MAX_PLAYER_HEALTH, MAX_SOUL, SOUL_COST_HEAL } from '../game/types';
import { Volume2, VolumeX, Pause, Play, HelpCircle, Gamepad2 } from 'lucide-react';

interface HUDProps {
  health: number;
  soul: number;
  isFocusing: boolean;
  bossPhase: 1 | 2;
  bossHealth: number;
  bossMaxHealth: number;
  bossName: string;
  isMuted: boolean;
  isPaused: boolean;
  gamepadConnected?: boolean;
  gamepadName?: string;
  gamepadToast?: string | null;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenControls: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  soul,
  isFocusing,
  bossPhase,
  bossHealth,
  bossMaxHealth,
  bossName,
  isMuted,
  isPaused,
  gamepadConnected = false,
  gamepadName = '',
  gamepadToast = null,
  onToggleMute,
  onTogglePause,
  onOpenControls,
}) => {
  const bossHealthPercent = Math.max(0, Math.min(100, (bossHealth / bossMaxHealth) * 100));
  const canHeal = health < MAX_PLAYER_HEALTH && soul >= SOUL_COST_HEAL;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Toast Notification (Gamepad connect/disconnect) */}
      {gamepadToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 rounded bg-slate-950/95 border border-amber-500/70 shadow-[0_4px_24px_rgba(0,0,0,0.85)] flex items-center gap-2.5 text-xs text-amber-200 font-cinzel animate-fade-in tracking-wider">
          <Gamepad2 size={16} className="text-amber-400 shrink-0" />
          <span>{gamepadToast}</span>
        </div>
      )}
      {/* Top Bar: Masks, Soul Vessel & Boss Health */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Soul Vessel & Health Masks */}
        <div className="flex items-center gap-3">
          {/* Soul Vessel (circular/curved vessel) */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-700 bg-slate-950/80 p-1 shadow-lg shadow-black/60 flex items-center justify-center">
            {/* Soul liquid fill */}
            <div
              className="absolute bottom-1 w-[85%] rounded-b-full bg-gradient-to-t from-sky-500 via-sky-300 to-white transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.7)]"
              style={{
                height: `${Math.min(88, (soul / MAX_SOUL) * 88)}%`,
                opacity: soul > 0 ? 0.95 : 0.2,
              }}
            />

            {/* Vessel Glass Reflection */}
            <div className="absolute inset-0 rounded-full border border-sky-400/30 pointer-events-none" />
            <div className="absolute top-1 left-2 w-4 h-2 bg-white/40 rounded-full blur-[1px] -rotate-45" />

            {/* Heal Ready Pulse */}
            {canHeal && (
              <div className="absolute inset-0 rounded-full border-2 border-sky-300 animate-ping opacity-60 pointer-events-none" />
            )}

            {/* Inner soul icon or percentage */}
            <span className="relative text-[10px] sm:text-xs font-bold text-sky-100 tracking-wider font-cinzel drop-shadow-md">
              {Math.floor(soul)}%
            </span>
          </div>

          {/* Masks Array */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {Array.from({ length: MAX_PLAYER_HEALTH }).map((_, idx) => {
              const isFilled = idx < health;
              return (
                <div
                  key={idx}
                  className={`relative w-6 h-8 sm:w-8 sm:h-10 transition-transform duration-200 ${
                    isFilled ? 'scale-100' : 'scale-90 opacity-40'
                  }`}
                >
                  {/* Insectoid Mask SVG */}
                  <svg
                    viewBox="0 0 32 44"
                    fill="none"
                    className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                  >
                    {isFilled ? (
                      <>
                        {/* Horns & Face Outline */}
                        <path
                          d="M16 4C10 4 5 12 5 22C5 33 11 41 16 41C21 41 27 33 27 22C27 12 22 4 16 4Z"
                          fill="#e2e8f0"
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        {/* Left Horn */}
                        <path
                          d="M10 8C7 3 2 1 1 0C2 4 4 9 7 13"
                          stroke="#e2e8f0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        {/* Right Horn */}
                        <path
                          d="M22 8C25 3 30 1 31 0C30 4 28 9 25 13"
                          stroke="#e2e8f0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        {/* Hollow Eyes */}
                        <ellipse cx="12" cy="22" rx="2.5" ry="4.5" fill="#090d16" />
                        <ellipse cx="20" cy="22" rx="2.5" ry="4.5" fill="#090d16" />
                      </>
                    ) : (
                      <>
                        {/* Cracked/Broken Mask */}
                        <path
                          d="M16 4C10 4 5 12 5 22C5 33 11 41 16 41C21 41 27 33 27 22C27 12 22 4 16 4Z"
                          fill="#1e293b"
                          stroke="#475569"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                        {/* Crack line */}
                        <path d="M16 8L13 20L19 28L15 38" stroke="#ef4444" strokeWidth="1.5" />
                      </>
                    )}
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Focus indicator prompt */}
          {canHeal && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/70 border border-sky-500/40 text-[11px] text-sky-200 animate-pulse font-cinzel">
              <span>Maintenir [S / K] pour Soin</span>
            </div>
          )}
        </div>

        {/* Center: Boss Health Bar (Ornate Filigree Frame) */}
        <div className="flex flex-col items-center w-64 sm:w-80 md:w-96 px-2">
          {/* Boss Title & Phase */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-100 font-cinzel uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {bossName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-950/60 text-amber-300 font-cinzel font-semibold">
              Phase {bossPhase}
            </span>
          </div>

          {/* Health Bar Container */}
          <div className="relative w-full h-4 sm:h-5 bg-slate-950/90 rounded-sm border border-amber-600/50 p-0.5 shadow-lg shadow-black">
            {/* Background track ticks */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-4">
              <div className="w-[1px] h-full bg-slate-800" />
              <div className="w-[1px] h-full bg-slate-800" />
              <div className="w-[1px] h-full bg-slate-800" />
            </div>

            {/* Health fill */}
            <div
              className="h-full bg-gradient-to-r from-red-700 via-amber-600 to-amber-400 transition-all duration-200 rounded-[1px] shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${bossHealthPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Sound & Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {gamepadConnected && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900/90 border border-emerald-500/50 text-emerald-300 text-xs shadow-md"
              title={`Manette connectée : ${gamepadName}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Gamepad2 size={16} className="text-emerald-400" />
              <span className="text-[11px] font-cinzel font-semibold tracking-wider text-emerald-200">
                {gamepadName || 'Manette active'}
              </span>
            </div>
          )}

          <button
            onClick={onOpenControls}
            className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shadow-md"
            title="Contrôles et Guide"
            aria-label="Contrôles"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shadow-md"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            aria-label="Son"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={onTogglePause}
            className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shadow-md"
            title={isPaused ? 'Reprendre' : 'Pause'}
            aria-label="Pause"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </div>

      {/* Focus Channeling Bar (appears over Knight when focusing) */}
      {isFocusing && (
        <div className="self-center flex flex-col items-center gap-1 mb-8 animate-pulse">
          <span className="text-xs font-semibold text-sky-200 tracking-wider font-cinzel">
            CONCENTRATION D'ÂME...
          </span>
          <div className="w-36 h-2 bg-slate-950 rounded-full border border-sky-400/60 overflow-hidden">
            <div className="h-full bg-sky-300 animate-[pulse_1s_ease-in-out_infinite] w-full" />
          </div>
        </div>
      )}
    </div>
  );
};
