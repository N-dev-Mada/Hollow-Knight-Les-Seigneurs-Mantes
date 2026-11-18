/**
 * Controls and Combat Guide modal explaining mechanics, pogo timing, and boss patterns.
 */

import React from 'react';
import { X, Swords, Wind, Sparkles, Heart } from 'lucide-react';

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-md bg-slate-950 border border-slate-700 p-6 sm:p-8 text-slate-100 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Swords className="text-amber-400" size={22} />
            <h3 className="text-xl font-bold font-cinzel text-amber-200 uppercase tracking-wider">
              Guide & Raccourcis de Combat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
            <span className="text-xs text-amber-400 font-cinzel uppercase font-semibold block mb-1">
              Déplacement & Saut
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-200 font-mono">Q / D</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-200 font-mono">← / →</kbd> : Courir</li>
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-200 font-mono">Espace</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-200 font-mono">Z / W / ↑</kbd> : Saut variable (maintenez pour sauter plus haut)</li>
            </ul>
          </div>

          <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
            <span className="text-xs text-sky-400 font-cinzel uppercase font-semibold block mb-1">
              Aiguillon & Pogo
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-200 font-mono">J</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-200 font-mono">X</kbd> : Coup d'aiguillon</li>
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-200 font-mono">Bas + J / X</kbd> en l'air : <strong>POGO</strong> (rebondit sur les boss et les glaives !)</li>
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-200 font-mono">Haut + J / X</kbd> : Frappe vers le haut</li>
            </ul>
          </div>

          <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
            <span className="text-xs text-purple-400 font-cinzel uppercase font-semibold block mb-1 flex items-center gap-1.5">
              <Wind size={13} /> Esquive (Dash)
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-200 font-mono">L</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-200 font-mono">Shift</kbd> : Cape d'Ailes de Papillon</li>
              <li>Procure des <strong>frames d'invincibilité</strong> (i-frames) traversant les projectiles et le corps du boss.</li>
              <li>Le Pogo réinitialise instantanément le cooldown du Dash !</li>
            </ul>
          </div>

          <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
            <span className="text-xs text-emerald-400 font-cinzel uppercase font-semibold block mb-1 flex items-center gap-1.5">
              <Heart size={13} /> Focus & Âme (Soin)
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-200 font-mono">S</kbd> ou <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-200 font-mono">K</kbd> (maintenir) : Canaliser l'Âme</li>
              <li>Chaque coup d'aiguillon réussi charge le réceptacle d'Âme (+12%).</li>
              <li>Consomme 33% d'Âme pour restaurer 1 Masque de vie après 1,1s d'immobilité.</li>
            </ul>
          </div>
        </div>

        {/* Gamepad Mapping Section */}
        <div className="border-t border-slate-800 pt-4 mb-5">
          <h4 className="text-xs font-bold text-emerald-400 font-cinzel uppercase tracking-wider mb-2 flex items-center gap-1.5">
            🎮 Contrôles Manette (Gamepad API : Xbox / PlayStation / Switch)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5">
              <div>
                <strong className="text-amber-200">Stick Gauche ou D-Pad :</strong> Déplacement horizontal et orientation (Haut / Bas pour l'Aiguillon)
              </div>
              <div>
                <strong className="text-sky-300">Bouton A (Xbox) / ✕ (PS) / B (Switch) :</strong> Saut à hauteur variable
              </div>
              <div>
                <strong className="text-amber-300">Bouton X (Xbox) / ▢ (PS) / Y (Switch) :</strong> Coup d'Aiguillon (+ Stick Bas en l'air pour <strong>POGO</strong>)
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5">
              <div>
                <strong className="text-purple-300">Bouton B / Gâchettes LB / RB :</strong> Dash (Ruée avec i-frames)
              </div>
              <div>
                <strong className="text-emerald-300">Bouton Y / Gâchettes LT / RT :</strong> Focus (Canalisation d'Âme au sol)
              </div>
              <div>
                <strong className="text-slate-300">Bouton Start / Options :</strong> Pause / Reprendre le combat
              </div>
            </div>
          </div>
        </div>

        {/* Moveset des Seigneurs Mantis */}
        <div className="border-t border-slate-800 pt-4 mb-5">
          <h4 className="text-xs font-bold text-amber-300 font-cinzel uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={13} /> Patterns des Seigneurs Mantis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <strong className="text-amber-200 block mb-0.5">1. Le Dash au Sol</strong>
              Apparaît sur un côté, lueurs oculaires ambrées, et fonce à ras du sol. Sautez par-dessus et assénez un coup vers le bas (Pogo) !
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <strong className="text-amber-200 block mb-0.5">2. Le Vol Plongeant</strong>
              Apparaît dans les airs au-dessus de vous et plonge à la verticale. Déplacez-vous sur le côté ou dashez, puis frappez lors de sa brève récupération au sol.
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <strong className="text-amber-200 block mb-0.5">3. Glaive Boomerang</strong>
              S'accroche au mur et lance un disque tranchant circulaire. Vous pouvez sauter par-dessus ou même pogo sur le disque !
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Compris, retourner au combat
          </button>
        </div>
      </div>
    </div>
  );
};
