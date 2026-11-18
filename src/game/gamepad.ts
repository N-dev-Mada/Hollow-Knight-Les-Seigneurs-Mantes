/**
 * GamepadManager: Full Gamepad API integration for standard controllers
 * (Xbox, PlayStation, Nintendo Switch, generic PC gamepads).
 * Handles hot-plugging, analog deadzones, edge-triggered presses, and haptics.
 */

import { GamepadWithHaptics } from './types';

export interface GamepadInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  bPressed: boolean;
  attackPressed: boolean;
  dashPressed: boolean;
  focus: boolean;
  pausePressed: boolean;
  selectPressed: boolean;
  startPressed: boolean;
  anyButtonPressed: boolean;
}

export class GamepadManager {
  public isConnected: boolean = false;
  public gamepadName: string = '';
  public activeIndex: number | null = null;

  private prevButtons: boolean[] = [];
  private readonly deadzone: number = 0.25;
  private connectionCallbacks: ((connected: boolean, name: string) => void)[] = [];

  constructor() {
    this.initEventListeners();
    // Check initial state
    this.checkInitialGamepads();
  }

  private initEventListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.handleGamepadConnected(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      this.handleGamepadDisconnected(e.gamepad);
    });
  }

  private checkInitialGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    try {
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp && gp.connected) {
          this.handleGamepadConnected(gp);
          break;
        }
      }
    } catch {
      // Ignore security/sandbox restriction if any
    }
  }

  private formatGamepadName(rawId: string): string {
    // Sanitize browser gamepad id string (e.g. "Xbox 360 Controller (XInput STANDARD GAMEPAD)" -> "Xbox Controller")
    let name = rawId;
    if (/xbox/i.test(name)) name = 'Manette Xbox';
    else if (/playstation|dualshock|dualsense/i.test(name)) name = 'Manette PlayStation';
    else if (/nintendo|switch|joy-con|pro controller/i.test(name)) name = 'Manette Switch';
    else {
      // Extract main vendor/product description
      name = name.replace(/\(STANDARD GAMEPAD\)/gi, '').replace(/vendor:.*/gi, '').trim();
      if (!name) name = 'Manette de jeu';
    }
    return name;
  }

  private handleGamepadConnected(gp: Gamepad) {
    this.isConnected = true;
    this.activeIndex = gp.index;
    this.gamepadName = this.formatGamepadName(gp.id);
    this.prevButtons = [];

    this.notifyConnectionChange(true, this.gamepadName);
  }

  private handleGamepadDisconnected(gp: Gamepad) {
    if (this.activeIndex === gp.index) {
      this.isConnected = false;
      this.activeIndex = null;
      const oldName = this.gamepadName;
      this.gamepadName = '';
      this.prevButtons = [];

      // Check if another gamepad is still connected
      this.checkInitialGamepads();

      if (!this.isConnected) {
        this.notifyConnectionChange(false, oldName);
      }
    }
  }

  public onConnectionChange(callback: (connected: boolean, name: string) => void) {
    this.connectionCallbacks.push(callback);
    // If already connected, call immediately
    if (this.isConnected) {
      callback(true, this.gamepadName);
    }
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyConnectionChange(connected: boolean, name: string) {
    for (const cb of this.connectionCallbacks) {
      try {
        cb(connected, name);
      } catch (err) {
        if (import.meta.env?.DEV) {
          console.error('Gamepad callback error:', err);
        }
      }
    }
  }

  /**
   * Polls gamepad state and returns structured game inputs.
   * Call once per frame inside the game loop.
   */
  public poll(): GamepadInputState {
    const defaultState: GamepadInputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      bPressed: false,
      attackPressed: false,
      dashPressed: false,
      focus: false,
      pausePressed: false,
      selectPressed: false,
      startPressed: false,
      anyButtonPressed: false,
    };

    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return defaultState;
    }

    let gp: Gamepad | null = null;
    try {
      const gamepads = navigator.getGamepads();
      if (this.activeIndex !== null && gamepads[this.activeIndex] && gamepads[this.activeIndex]!.connected) {
        gp = gamepads[this.activeIndex];
      } else {
        // Fallback to first connected gamepad
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && gamepads[i]!.connected) {
            gp = gamepads[i];
            if (!this.isConnected) {
              this.handleGamepadConnected(gp!);
            }
            break;
          }
        }
      }
    } catch {
      return defaultState;
    }

    if (!gp) {
      if (this.isConnected) {
        this.isConnected = false;
        this.notifyConnectionChange(false, this.gamepadName);
      }
      return defaultState;
    }

    const currentButtons: boolean[] = [];
    const getBtn = (idx: number): boolean => {
      if (idx < gp!.buttons.length) {
        const b = gp!.buttons[idx];
        return typeof b === 'object' ? b.pressed || b.value > 0.4 : b > 0.4;
      }
      return false;
    };

    // Preload button states
    for (let i = 0; i < Math.max(16, gp.buttons.length); i++) {
      currentButtons[i] = getBtn(i);
    }

    const wasJustPressed = (idx: number): boolean => {
      const isDown = currentButtons[idx] || false;
      const wasDown = this.prevButtons[idx] || false;
      return isDown && !wasDown;
    };

    // --- STANDARD MAPPINGS ---
    // 0: A / Cross / B (Jump)
    // 1: B / Circle / A (Dash)
    // 2: X / Square / Y (Attack Nail)
    // 3: Y / Triangle / X (Focus Heal)
    // 4: LB (Left Bumper) -> Dash
    // 5: RB (Right Bumper) -> Dash
    // 6: LT (Left Trigger) -> Focus
    // 7: RT (Right Trigger) -> Focus
    // 8: Back / Select / Share
    // 9: Start / Options / Menu
    // 12: Dpad Up
    // 13: Dpad Down
    // 14: Dpad Left
    // 15: Dpad Right

    const btnA = currentButtons[0];
    const btnY = currentButtons[3];
    const btnLT = currentButtons[6];
    const btnRT = currentButtons[7];
    const dpadUp = currentButtons[12];
    const dpadDown = currentButtons[13];
    const dpadLeft = currentButtons[14];
    const dpadRight = currentButtons[15];

    // Left Analog Stick
    let stickX = 0;
    let stickY = 0;
    if (gp.axes.length >= 2) {
      stickX = gp.axes[0];
      stickY = gp.axes[1];
    }

    // Directional calculation with deadzone
    const leftStickLeft = stickX < -this.deadzone;
    const leftStickRight = stickX > this.deadzone;
    const leftStickUp = stickY < -this.deadzone;
    const leftStickDown = stickY > this.deadzone;

    // Output State
    const left = dpadLeft || leftStickLeft;
    const right = dpadRight || leftStickRight;
    const up = dpadUp || leftStickUp;
    const down = dpadDown || leftStickDown;

    const jump = btnA;
    const jumpPressed = wasJustPressed(0);
    const bPressed = wasJustPressed(1);

    const attackPressed = wasJustPressed(2);

    const dashPressed = wasJustPressed(1) || wasJustPressed(4) || wasJustPressed(5);

    const focus = btnY || btnLT || btnRT;

    const pausePressed = wasJustPressed(9) || wasJustPressed(8);
    const startPressed = wasJustPressed(9);
    const selectPressed = wasJustPressed(8);

    const anyButtonPressed =
      jumpPressed || bPressed || attackPressed || dashPressed || wasJustPressed(3) || wasJustPressed(9);

    // Save previous button states for next frame edge detection
    this.prevButtons = currentButtons;

    return {
      left,
      right,
      up,
      down,
      jump,
      jumpPressed,
      bPressed,
      attackPressed,
      dashPressed,
      focus,
      pausePressed,
      selectPressed,
      startPressed,
      anyButtonPressed,
    };
  }

  /**
   * Triggers haptic feedback / vibration on compatible gamepads.
   */
  public vibrate(durationMs: number = 80, weak: number = 0.4, strong: number = 0.4) {
    if (typeof navigator === 'undefined' || !navigator.getGamepads || this.activeIndex === null) return;
    try {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[this.activeIndex] as GamepadWithHaptics | null;
      if (!gp) return;

      const actuator = gp.vibrationActuator;
      if (actuator && typeof actuator.playEffect === 'function') {
        actuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: weak,
          strongMagnitude: strong,
        }).catch(() => {});
      }
    } catch {
      // Vibration not supported or not allowed
    }
  }

  /**
   * Immediately stops any ongoing haptic feedback or vibration.
   */
  public stopVibration() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads || this.activeIndex === null) return;
    try {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[this.activeIndex] as GamepadWithHaptics | null;
      if (!gp) return;

      const actuator = gp.vibrationActuator;

      if (actuator) {
        if (typeof actuator.reset === 'function') {
          actuator.reset().catch(() => {});
        } else if (typeof actuator.playEffect === 'function') {
          actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: 1,
            weakMagnitude: 0,
            strongMagnitude: 0,
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore
    }
  }
}

export const gamepadManager = new GamepadManager();
