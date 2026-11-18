/**
 * Écran titre du combat contre les Seigneurs Mantis.
 */

import React from 'react';
import { Volume2, VolumeX, Swords, BookOpen, Gamepad2 } from 'lucide-react';
import { audio } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  gamepadConnected?: boolean;
  gamepadName?: string;
  onToggleMute: () => void;
  onOpenControls: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  isMuted,
  gamepadConnected = false,
  gamepadName = '',
  onToggleMute,
  onOpenControls,
}) => {
  const handleStart = () => {
    audio.playUiSelect();
    onStart();
  };

  const handleOpenControls = () => {
    audio.playUiSelect();
    onOpenControls();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-gradient-to-b from-black/60 via-black/40 to-black/75 backdrop-blur-[0.5px]">
      {/* Top Header Bar */}
      <div className="w-full flex justify-between items-center max-w-4xl">
        <span className="text-[11px] font-cinzel tracking-[0.3em] text-slate-400 uppercase">
          Village des Mantes
        </span>

        <div className="flex items-center gap-3">
          {gamepadConnected && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-cinzel shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Gamepad2 size={13} />
              <span className="tracking-wider">{gamepadName || 'Manette'}</span>
            </div>
          )}

          <button
            onClick={() => {
              audio.playUiSelect();
              onToggleMute();
            }}
            onMouseEnter={() => audio.playUiHover()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition cursor-pointer shadow-sm"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} className="text-amber-400" />}
            <span className="font-cinzel text-[10px]">{isMuted ? 'Muet' : 'Audio'}</span>
          </button>
        </div>
      </div>

      {/* Hero Centerpiece - Streamlined & Atmospheric */}
      <div className="flex flex-col items-center text-center my-auto animate-fade-in max-w-xl">
        {/* Subtitle tag */}
        <span className="text-[11px] sm:text-xs tracking-[0.45em] text-amber-400/80 uppercase font-cinzel mb-2 drop-shadow-sm">
          H A L L O W N E S T
        </span>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-amber-200 font-cinzel drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
          SEIGNEURS MANTIS
        </h1>

        {/* Divider with Subtitle */}
        <div className="flex items-center gap-3 mt-2 mb-8 text-slate-400 text-xs tracking-[0.3em] font-cinzel uppercase">
          <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" />
          <span>Salle du Trône</span>
          <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" />
        </div>

        {/* Action Buttons (Uniform, arcade-style video game plaques) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          {/* Main Play CTA Button */}
          <button
            onClick={handleStart}
            onMouseEnter={() => audio.playUiHover()}
            className="group relative w-64 sm:w-72 h-14 rounded bg-gradient-to-b from-amber-950/80 via-slate-950/95 to-black border-2 border-amber-500/80 hover:border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-between px-5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <div className="flex items-center gap-3 z-10">
              <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 group-hover:text-amber-200 group-hover:scale-105 transition-all shadow-inner">
                <Swords size={18} />
              </div>
              <span className="font-cinzel font-bold text-xs sm:text-sm text-amber-100 group-hover:text-white tracking-[0.16em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                ENGAGER LE COMBAT
              </span>
            </div>
            <kbd className="z-10 text-[10px] px-2 py-0.5 rounded bg-black/80 border border-amber-600/50 text-amber-300 group-hover:border-amber-400 group-hover:text-amber-100 font-mono tracking-wider shadow-sm">
              {gamepadConnected ? 'A' : 'Espace'}
            </kbd>
          </button>

          {/* Guide CTA Button */}
          <button
            onClick={handleOpenControls}
            onMouseEnter={() => audio.playUiHover()}
            className="group relative w-64 sm:w-72 h-14 rounded bg-gradient-to-b from-slate-900/80 via-slate-950/95 to-black border-2 border-slate-700 hover:border-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(226,232,240,0.35)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-between px-5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <div className="flex items-center gap-3 z-10">
              <div className="w-8 h-8 rounded bg-slate-800/50 border border-slate-600/60 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:scale-105 transition-all shadow-inner">
                <BookOpen size={18} />
              </div>
              <span className="font-cinzel font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white tracking-[0.16em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                GUIDE & COMMANDES
              </span>
            </div>
            <kbd className="z-10 text-[10px] px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-slate-300 group-hover:border-slate-400 group-hover:text-white font-mono tracking-wider shadow-sm">
              Guide
            </kbd>
          </button>
        </div>
      </div>

      {/* Discreet Single-Line Control Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] text-slate-400 font-sans tracking-wide">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-amber-200 font-mono text-[10px]">ZQSD / Stick</kbd>
          <span className="text-slate-400">Déplacement</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-amber-200 font-mono text-[10px]">Espace / A</kbd>
          <span className="text-slate-400">Saut</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-sky-200 font-mono text-[10px]">J / X</kbd>
          <span className="text-slate-400">Aiguillon & Pogo</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-purple-200 font-mono text-[10px]">L / B</kbd>
          <span className="text-slate-400">Dash</span>
        </span>
      </div>
    </div>
  );
};
