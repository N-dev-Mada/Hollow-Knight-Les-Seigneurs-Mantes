/**
 * Optional virtual on-screen controls for touch devices and mobile screens.
 */

import React from 'react';
import { GameEngine } from '../game/engine';
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Zap, Wind, Swords, Heart } from 'lucide-react';

interface VirtualControlsProps {
  engine: GameEngine;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ engine }) => {
  const handleTouch = (key: keyof typeof engine.touchInput, value: boolean) => {
    engine.touchInput[key] = value;
    if (value) {
      if (key === 'jump') engine.touchInput.jumpPressed = true;
      if (key === 'dashPressed') engine.touchInput.dashPressed = true;
      if (key === 'attackPressed') engine.touchInput.attackPressed = true;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex justify-between items-end p-4 pb-6">
      {/* Left: Directional Controls */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onTouchStart={(e) => { e.preventDefault(); handleTouch('up', true); }}
          onTouchEnd={(e) => { e.preventDefault(); handleTouch('up', false); }}
          onTouchCancel={(e) => { e.preventDefault(); handleTouch('up', false); }}
          onMouseDown={() => handleTouch('up', true)}
          onMouseUp={() => handleTouch('up', false)}
          onMouseLeave={() => handleTouch('up', false)}
          className="w-12 h-12 rounded-full bg-slate-900/80 active:bg-amber-500/40 border border-slate-700/80 flex items-center justify-center text-slate-200 active:text-amber-300 shadow-lg active:scale-95 touch-none"
          aria-label="Haut"
        >
          <ArrowUp size={22} />
        </button>
        <div className="flex gap-2">
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('left', false); }}
            onMouseDown={() => handleTouch('left', true)}
            onMouseUp={() => handleTouch('left', false)}
            onMouseLeave={() => handleTouch('left', false)}
            className="w-13 h-13 rounded-full bg-slate-900/80 active:bg-amber-500/40 border border-slate-700/80 flex items-center justify-center text-slate-200 active:text-amber-300 shadow-lg active:scale-95 touch-none"
            aria-label="Gauche"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('down', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('down', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('down', false); }}
            onMouseDown={() => handleTouch('down', true)}
            onMouseUp={() => handleTouch('down', false)}
            onMouseLeave={() => handleTouch('down', false)}
            className="w-13 h-13 rounded-full bg-slate-900/80 active:bg-amber-500/40 border border-slate-700/80 flex items-center justify-center text-slate-200 active:text-amber-300 shadow-lg active:scale-95 touch-none"
            aria-label="Bas"
          >
            <ArrowDown size={24} />
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('right', false); }}
            onMouseDown={() => handleTouch('right', true)}
            onMouseUp={() => handleTouch('right', false)}
            onMouseLeave={() => handleTouch('right', false)}
            className="w-13 h-13 rounded-full bg-slate-900/80 active:bg-amber-500/40 border border-slate-700/80 flex items-center justify-center text-slate-200 active:text-amber-300 shadow-lg active:scale-95 touch-none"
            aria-label="Droite"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex gap-2 mb-1">
          {/* Focus Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('focus', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('focus', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('focus', false); }}
            onMouseDown={() => handleTouch('focus', true)}
            onMouseUp={() => handleTouch('focus', false)}
            onMouseLeave={() => handleTouch('focus', false)}
            className="w-12 h-12 rounded-full bg-emerald-950/80 active:bg-emerald-500/50 border border-emerald-500/50 flex flex-col items-center justify-center text-emerald-300 active:scale-95 shadow-lg touch-none"
            aria-label="Focus Soin"
          >
            <Heart size={16} />
            <span className="text-[9px] font-cinzel font-bold">SOIN</span>
          </button>

          {/* Dash Button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('dashPressed', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('dashPressed', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('dashPressed', false); }}
            onMouseDown={() => handleTouch('dashPressed', true)}
            onMouseUp={() => handleTouch('dashPressed', false)}
            onMouseLeave={() => handleTouch('dashPressed', false)}
            className="w-12 h-12 rounded-full bg-purple-950/80 active:bg-purple-500/50 border border-purple-500/50 flex flex-col items-center justify-center text-purple-300 active:scale-95 shadow-lg touch-none"
            aria-label="Dash"
          >
            <Wind size={16} />
            <span className="text-[9px] font-cinzel font-bold">DASH</span>
          </button>
        </div>

        <div className="flex gap-3">
          {/* Attack (Aiguillon) */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('attackPressed', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('attackPressed', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('attackPressed', false); }}
            onMouseDown={() => handleTouch('attackPressed', true)}
            onMouseUp={() => handleTouch('attackPressed', false)}
            onMouseLeave={() => handleTouch('attackPressed', false)}
            className="w-15 h-15 rounded-full bg-amber-950/80 active:bg-amber-500/50 border border-amber-500/60 flex flex-col items-center justify-center text-amber-200 active:scale-95 shadow-lg touch-none"
            aria-label="Aiguillon"
          >
            <Swords size={20} />
            <span className="text-[10px] font-cinzel font-bold">ATTAQUE</span>
          </button>

          {/* Jump */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouch('jump', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouch('jump', false); }}
            onTouchCancel={(e) => { e.preventDefault(); handleTouch('jump', false); }}
            onMouseDown={() => handleTouch('jump', true)}
            onMouseUp={() => handleTouch('jump', false)}
            onMouseLeave={() => handleTouch('jump', false)}
            className="w-15 h-15 rounded-full bg-sky-950/80 active:bg-sky-500/50 border border-sky-500/60 flex flex-col items-center justify-center text-sky-200 active:scale-95 shadow-lg touch-none"
            aria-label="Saut"
          >
            <Zap size={20} />
            <span className="text-[10px] font-cinzel font-bold">SAUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
