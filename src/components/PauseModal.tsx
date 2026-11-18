/**
 * In-game pause modal with quick settings and restart options.
 */

import React from 'react';
import { Play, RefreshCw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  isMuted: boolean;
  volume: number;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  isMuted,
  volume,
  onResume,
  onRestart,
  onTitle,
  onToggleMute,
  onVolumeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 select-none backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-md bg-slate-950 border border-slate-700 p-6 text-center shadow-2xl animate-scale-up">
        <h3 className="text-xl font-bold font-cinzel text-amber-200 tracking-wider uppercase mb-1">
          COMBAT EN PAUSE
        </h3>
        <p className="text-slate-400 text-xs font-cinzel mb-6">
          Respirez, étudiez la salle, reprenez vos esprits.
        </p>

        {/* Volume slider */}
        <div className="flex items-center justify-between gap-3 p-3 rounded bg-slate-900/80 border border-slate-800 mb-6">
          <button
            onClick={onToggleMute}
            className="text-slate-300 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-slate-400 font-mono w-8 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-cinzel tracking-wider uppercase transition shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={16} />
            <span>Reprendre</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-cinzel text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Recommencer le combat</span>
          </button>
          <button
            onClick={onTitle}
            className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 font-cinzel text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={14} />
            <span>Menu Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
