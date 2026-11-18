/**
 * Game constants, interfaces, and state definitions for Mantis Lords.
 */

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const FLOOR_Y = 620;
export const ARENA_LEFT = 90;
export const ARENA_RIGHT = 1190;

export const MAX_PLAYER_HEALTH = 5;
export const MAX_SOUL = 100;
export const SOUL_PER_HIT = 12;
export const SOUL_COST_HEAL = 33;

export type GamePhase =
  | 'TITLE'
  | 'INTRO_CINEMATIC'
  | 'PHASE_1'
  | 'TRANSITION'
  | 'PHASE_2'
  | 'VICTORY'
  | 'GAMEOVER';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  dashPressed: boolean;
  focus: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity?: number;
  bounce?: boolean;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'shockwave' | 'soul';
}

export interface Afterimage {
  x: number;
  y: number;
  facing: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  pose: 'dash' | 'dive';
  color: string;
  decay: number;
  rotation?: number;
}

export interface SlashEffect {
  x: number;
  y: number;
  direction: 'left' | 'right' | 'up' | 'down';
  progress: number; // 0 to 1
  duration: number; // seconds
  size: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  width: number;
  alpha: number;
  color: string;
  speed: number;
}

export interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface GamepadWithHaptics extends Omit<Gamepad, 'vibrationActuator'> {
  vibrationActuator?: {
    playEffect: (
      type: string,
      params: {
        startDelay?: number;
        duration?: number;
        weakMagnitude?: number;
        strongMagnitude?: number;
      }
    ) => Promise<unknown>;
    reset?: () => Promise<unknown>;
  };
}
