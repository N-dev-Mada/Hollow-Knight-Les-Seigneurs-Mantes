/**
 * Victory modal shown when the Mantis Lords are defeated and bow to the Knight.
 * Displays combat statistics and replay actions.
 */

import React from 'react';
import { GameStats } from '../game/engine';
import { Trophy, RefreshCw, Home, Heart, Zap, Crosshair } from 'lucide-react';

interface VictoryModalProps {
  stats: GameStats;
  onRestart: () => void;
  onTitle: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRestart, onTitle }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-md bg-slate-950/95 border-2 border-amber-500/70 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-scale-up">
        {/* Crest */}
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mb-3">
          <Trophy size={28} className="text-amber-400" />
        </div>

        {/* Victory Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-200 font-cinzel tracking-wider uppercase">
          TRIOMPHE DES MANTES
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 mb-6 font-cinzel italic">
          « La fière tribu des Mantes s’incline devant la maîtrise de votre Aiguillon. »
        </p>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-cinzel uppercase">Temps de Combat</span>
            <span className="text-lg font-bold text-amber-300 font-mono">{formatTime(stats.timeElapsed)}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-cinzel uppercase flex items-center justify-center gap-1">
              <Zap size={11} className="text-sky-400" /> Pogos Réussis
            </span>
            <span className="text-lg font-bold text-sky-300 font-mono">{stats.pogosLanded}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-cinzel uppercase flex items-center justify-center gap-1">
              <Crosshair size={11} className="text-amber-400" /> Coups Portés
            </span>
            <span className="text-lg font-bold text-amber-300 font-mono">{stats.hitsDealt}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-cinzel uppercase flex items-center justify-center gap-1">
              <Heart size={11} className="text-red-400" /> Dégâts Subis
            </span>
            <span className="text-lg font-bold text-red-400 font-mono">{stats.hitsTaken}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-cinzel uppercase flex items-center justify-center gap-1">
              <Heart size={11} className="text-emerald-400" /> Soins d'Âme
            </span>
            <span className="text-lg font-bold text-emerald-300 font-mono">{stats.healsPerformed}</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-cinzel uppercase">Rang de Maîtrise</span>
            <span className="text-lg font-bold text-yellow-400 font-cinzel">
              {stats.hitsTaken === 0 ? 'S+ (Sans Dégât)' : stats.hitsTaken <= 2 ? 'S (Pur)' : 'A (Maître)'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-cinzel tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Rejouer le Combat</span>
          </button>
          <button
            onClick={onTitle}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-cinzel tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={16} />
            <span>Menu Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
