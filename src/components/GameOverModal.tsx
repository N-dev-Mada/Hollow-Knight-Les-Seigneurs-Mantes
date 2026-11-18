/**
 * Écran de défaite avec actions de relance et retour au menu.
 */

import React, { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import { audio } from '../game/audio';

interface GameOverModalProps {
  onRestart: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart, onTitle }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        audio.playUiSelect();
        onRestart();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        audio.playUiSelect();
        onTitle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRestart, onTitle]);

  const handleRestartClick = () => {
    audio.playUiSelect();
    onRestart();
  };

  const handleTitleClick = () => {
    audio.playUiSelect();
    onTitle();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-16 sm:pb-20 select-none pointer-events-auto animate-fade-in">
      {/* Visual group placed seamlessly on the same plane as the scene and DÉFAITE banner */}
      <div className="flex flex-col items-center text-center gap-6">
        {/* Sole accent text: HALLOWNEST */}
        <div className="flex items-center gap-3">
          <span className="w-12 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-red-500/70" />
          <span className="font-cinzel text-xs sm:text-sm font-semibold tracking-[0.4em] text-red-300 uppercase drop-shadow-[0_2px_8px_rgba(239,68,68,0.6)]">
            HALLOWNEST
          </span>
          <span className="w-12 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-red-500/70" />
        </div>

        {/* Action Buttons: Réessayer & Menu */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Bouton Réessayer */}
          <button
            onClick={handleRestartClick}
            onMouseEnter={() => audio.playUiHover()}
            className="group relative w-64 sm:w-72 h-14 rounded bg-gradient-to-b from-red-950/85 via-slate-950/95 to-black border-2 border-red-600/80 hover:border-amber-400 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.65)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-between px-5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <div className="flex items-center gap-3 z-10">
              <div className="w-8 h-8 rounded bg-red-900/40 border border-red-500/50 flex items-center justify-center text-red-400 group-hover:text-amber-300 group-hover:border-amber-400/60 transition-colors shadow-inner">
                <RefreshCw size={17} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <span className="font-cinzel font-bold text-xs sm:text-sm text-red-100 group-hover:text-amber-200 tracking-[0.16em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                RÉESSAYER
              </span>
            </div>
            <kbd className="z-10 text-[10px] px-2 py-0.5 rounded bg-black/80 border border-red-700/60 text-red-300 group-hover:border-amber-500/60 group-hover:text-amber-200 font-mono tracking-wider shadow-sm">
              Espace / A
            </kbd>
          </button>

          {/* Bouton Menu */}
          <button
            onClick={handleTitleClick}
            onMouseEnter={() => audio.playUiHover()}
            className="group relative w-64 sm:w-72 h-14 rounded bg-gradient-to-b from-slate-900/85 via-slate-950/95 to-black border-2 border-slate-700 hover:border-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(226,232,240,0.35)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer flex items-center justify-between px-5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <div className="flex items-center gap-3 z-10">
              <div className="w-8 h-8 rounded bg-slate-800/50 border border-slate-600/60 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:border-slate-300 transition-colors shadow-inner">
                <Home size={17} />
              </div>
              <span className="font-cinzel font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white tracking-[0.16em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                MENU
              </span>
            </div>
            <kbd className="z-10 text-[10px] px-2 py-0.5 rounded bg-black/80 border border-slate-700 text-slate-300 group-hover:border-slate-400 group-hover:text-white font-mono tracking-wider shadow-sm">
              Échap / B
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
