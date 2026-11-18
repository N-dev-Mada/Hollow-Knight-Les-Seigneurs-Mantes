/**
 * Responsive 16:9 Canvas component hosting the 60fps game loop and keyboard listener.
 */

import React, { useEffect, useRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/types';
import { GameEngine } from '../game/engine';

interface GameCanvasProps {
  engine: GameEngine;
  isPaused: boolean;
  isModalOpen?: boolean;
  onPauseToggle: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, isPaused, isModalOpen = false, onPauseToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isPausedRef = useRef<boolean>(isPaused);
  const isModalOpenRef = useRef<boolean>(isModalOpen);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- GAME LOOP ---
    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // Update simulation if not paused
      if (!isPausedRef.current) {
        engine.update(rawDt);
      }

      // Render frame
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      engine.render(ctx);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [engine]);

  // --- KEYBOARD INPUT HANDLING ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll for game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Pause toggle (during combat or transition/cinematic)
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (
          engine.phase === 'PHASE_1' ||
          engine.phase === 'PHASE_2' ||
          engine.phase === 'TRANSITION' ||
          engine.phase === 'INTRO_CINEMATIC'
        ) {
          onPauseToggle();
        }
        return;
      }

      // If paused or in title, only handle start or pause
      if (isPausedRef.current) return;

      if (engine.phase === 'TITLE') {
        if (isModalOpenRef.current) return;
        if (e.code === 'Space' || e.code === 'Enter') {
          engine.startGame();
        }
        return;
      }

      // Movement: Left
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        engine.keyboardInput.left = true;
      }
      // Movement: Right
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.keyboardInput.right = true;
      }
      // Up
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
        engine.keyboardInput.up = true;
      }
      // Down
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        engine.keyboardInput.down = true;
      }

      // Jump (Space or Up)
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
        if (!engine.keyboardInput.jump) {
          engine.keyboardInput.jumpPressed = true;
        }
        engine.keyboardInput.jump = true;
      }

      // Attack: Nail (J or X)
      if (e.code === 'KeyJ' || e.code === 'KeyX') {
        engine.keyboardInput.attackPressed = true;
      }

      // Dash (L or Shift)
      if (e.code === 'KeyL' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        engine.keyboardInput.dashPressed = true;
      }

      // Focus / Healing (Hold S or K)
      if (e.code === 'KeyK' || e.code === 'KeyS') {
        engine.keyboardInput.focus = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Movement: Left
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        engine.keyboardInput.left = false;
      }
      // Movement: Right
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.keyboardInput.right = false;
      }
      // Up
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
        engine.keyboardInput.up = false;
      }
      // Down
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        engine.keyboardInput.down = false;
      }

      // Jump
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
        engine.keyboardInput.jump = false;
      }

      // Focus
      if (e.code === 'KeyK' || e.code === 'KeyS') {
        engine.keyboardInput.focus = false;
      }
    };

    const handleBlur = () => {
      // Clear held inputs on window blur
      engine.keyboardInput.left = false;
      engine.keyboardInput.right = false;
      engine.keyboardInput.up = false;
      engine.keyboardInput.down = false;
      engine.keyboardInput.jump = false;
      engine.keyboardInput.focus = false;
      engine.input.left = false;
      engine.input.right = false;
      engine.input.up = false;
      engine.input.down = false;
      engine.input.jump = false;
      engine.input.focus = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [engine, onPauseToggle]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-[#040711] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full max-w-full max-h-full aspect-video object-contain shadow-2xl block"
      />
    </div>
  );
};
