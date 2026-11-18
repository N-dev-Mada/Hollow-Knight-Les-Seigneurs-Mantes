/**
 * Main game engine orchestrating inputs, game loop, AI choreography,
 * hitstop, camera shake, phase transitions, and rendering.
 */

import {
  CANVAS_WIDTH,
  FLOOR_Y,
  GamePhase,
  InputState,
} from './types';
import { Player } from './player';
import { MantisLord } from './boss';
import { ParticleSystem } from './particles';
import { ArenaRenderer } from './renderer';
import { audio } from './audio';
import { gamepadManager } from './gamepad';

export interface GameStats {
  timeElapsed: number;
  pogosLanded: number;
  hitsDealt: number;
  hitsTaken: number;
  healsPerformed: number;
}

export class GameEngine {
  public phase: GamePhase = 'TITLE';
  public player: Player;
  public lord0: MantisLord; // Center Lord (Phase 1)
  public lord1: MantisLord; // Left Sister (Phase 2)
  public lord2: MantisLord; // Right Sister (Phase 2)
  public particles: ParticleSystem;
  public arena: ArenaRenderer;

  // Camera Shake & Hitstop
  public shakeAmount: number = 0;
  public shakeDecay: number = 22;
  public hitstopTimer: number = 0;

  // AI Orchestration
  private phase1AttackTimer: number = 1.0;
  private phase1PatternIndex: number = 0;
  private phase2RoutineTimer: number = 1.2;
  private phase2RoutineIndex: number = 0;

  // Transition & Cinematic Timers
  private transitionTimer: number = 0;
  public bannerText: string = '';
  public bannerSubtext: string = '';
  public bannerAlpha: number = 0;

  // Stats
  public stats: GameStats = {
    timeElapsed: 0,
    pogosLanded: 0,
    hitsDealt: 0,
    hitsTaken: 0,
    healsPerformed: 0,
  };

  // Keyboard input state
  public keyboardInput: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    attackPressed: false,
    dashPressed: false,
    focus: false,
  };

  // Touch input state (virtual on-screen buttons)
  public touchInput: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    attackPressed: false,
    dashPressed: false,
    focus: false,
  };

  // Active merged input state (Keyboard + Gamepad + Touch)
  public input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    attackPressed: false,
    dashPressed: false,
    focus: false,
  };

  // Modal open flag to prevent title space/gamepad start
  public isModalOpen: boolean = false;

  // Scheduled delta-time actions (frozen during pause, cleared on reset)
  private scheduledActions: { delay: number; fn: () => void }[] = [];

  // State change callback to notify React UI (for HUD & overlays)
  public onStateChange?: () => void;
  public onPauseRequest?: () => void;
  public onMenuAction?: (action: 'confirm' | 'cancel') => void;

  constructor() {
    this.player = new Player();
    this.lord0 = new MantisLord(0);
    this.lord1 = new MantisLord(1);
    this.lord2 = new MantisLord(2);
    this.particles = new ParticleSystem();
    this.arena = new ArenaRenderer();
  }

  // --- GAME LIFECYCLE ---

  public startGame() {
    audio.init();
    this.player.reset();
    this.lord0.reset();
    this.lord1.reset();
    this.lord2.reset();
    this.particles.reset();
    this.scheduledActions = [];

    // Reset touch inputs
    this.touchInput = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      attackPressed: false,
      dashPressed: false,
      focus: false,
    };

    this.stats = {
      timeElapsed: 0,
      pogosLanded: 0,
      hitsDealt: 0,
      hitsTaken: 0,
      healsPerformed: 0,
    };

    this.phase = 'INTRO_CINEMATIC';
    this.transitionTimer = 2.4;
    this.bannerText = 'SEIGNEUR MANTIS';
    this.bannerSubtext = 'Maître de l’Aiguillon';
    this.bannerAlpha = 1.0;

    // Lord 0 initiates intro leap
    this.lord0.startIntroLeap();
    audio.startMusic(1);

    if (this.onStateChange) this.onStateChange();
  }

  public restart() {
    this.startGame();
  }

  public goToTitle() {
    audio.stopMusic();
    this.phase = 'TITLE';
    this.shakeAmount = 0;
    this.hitstopTimer = 0;
    this.scheduledActions = [];
    this.player.reset();
    this.lord0.reset();
    this.lord1.reset();
    this.lord2.reset();
    this.particles.reset();
    this.touchInput = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      jumpPressed: false,
      attackPressed: false,
      dashPressed: false,
      focus: false,
    };
    gamepadManager.stopVibration();
    if (this.onStateChange) this.onStateChange();
  }

  public addCameraShake(amount: number) {
    if (this.phase === 'TITLE') return;
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  public triggerHitstop(duration: number = 0.055) {
    this.hitstopTimer = duration;
  }

  // --- UPDATE LOOP ---

  public update(rawDt: number) {
    const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling or lag spike issues

    // Amortissement progressif du tremblement de caméra
    if (this.shakeAmount > 0) {
      this.shakeAmount = Math.max(0, this.shakeAmount - this.shakeDecay * dt);
    }

    // Always update arena fire & ambient particles even during hitstop or title
    this.arena.update(dt);
    this.particles.update(dt);

    // Poll Gamepad inputs each frame
    const gp = gamepadManager.poll();

    // Gamepad pause / menu toggle (only during active combat or cinematic)
    if (
      gp.pausePressed &&
      this.onPauseRequest &&
      (this.phase === 'PHASE_1' || this.phase === 'PHASE_2' || this.phase === 'TRANSITION' || this.phase === 'INTRO_CINEMATIC')
    ) {
      this.onPauseRequest();
    }

    if (this.phase === 'TITLE') {
      this.shakeAmount = 0;
      if (!this.isModalOpen && (gp.startPressed || gp.jumpPressed || gp.attackPressed)) {
        this.startGame();
      }
      return;
    }

    // Freeze combat loop on Game Over or Victory, but allow controller menu navigation
    if (this.phase === 'GAMEOVER' || this.phase === 'VICTORY') {
      if (this.onMenuAction) {
        if (gp.jumpPressed || gp.startPressed) {
          this.onMenuAction('confirm');
        } else if (gp.bPressed) {
          this.onMenuAction('cancel');
        }
      }
      return;
    }

    // Hitstop frame freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return; // Freeze game simulation for dramatic tactile impact
    }

    // Merge Keyboard, Gamepad & Touch inputs seamlessly
    this.input.left = this.keyboardInput.left || gp.left || this.touchInput.left;
    this.input.right = this.keyboardInput.right || gp.right || this.touchInput.right;
    this.input.up = this.keyboardInput.up || gp.up || this.touchInput.up;
    this.input.down = this.keyboardInput.down || gp.down || this.touchInput.down;
    this.input.jump = this.keyboardInput.jump || gp.jump || this.touchInput.jump;
    this.input.jumpPressed = this.keyboardInput.jumpPressed || gp.jumpPressed || this.touchInput.jumpPressed;
    this.input.attackPressed = this.keyboardInput.attackPressed || gp.attackPressed || this.touchInput.attackPressed;
    this.input.dashPressed = this.keyboardInput.dashPressed || gp.dashPressed || this.touchInput.dashPressed;
    this.input.focus = this.keyboardInput.focus || gp.focus || this.touchInput.focus;

    // Banner fade
    if (this.bannerAlpha > 0) {
      this.bannerAlpha = Math.max(0, this.bannerAlpha - dt * 0.45);
    }

    // Accumulate combat timer
    if (this.phase === 'PHASE_1' || this.phase === 'PHASE_2') {
      this.stats.timeElapsed += dt;
    }

    // Update Player
    const healthBeforePlayerUpdate = this.player.health;
    const wasFocusing = this.player.isFocusing;

    this.player.update(dt, this.input, this.particles);

    // Track heals
    if (wasFocusing && !this.player.isFocusing && this.player.health > healthBeforePlayerUpdate) {
      this.stats.healsPerformed++;
      if (this.onStateChange) this.onStateChange();
    }

    // Clear edge-triggered inputs for keyboard, gamepad and touch
    this.input.jumpPressed = false;
    this.input.attackPressed = false;
    this.input.dashPressed = false;
    this.keyboardInput.jumpPressed = false;
    this.keyboardInput.attackPressed = false;
    this.keyboardInput.dashPressed = false;
    this.touchInput.jumpPressed = false;
    this.touchInput.attackPressed = false;
    this.touchInput.dashPressed = false;

    // Health before boss actions
    const healthBeforeBossUpdate = this.player.health;

    // Phase management & Boss updates
    switch (this.phase) {
      case 'INTRO_CINEMATIC':
        this.updateIntroCinematic(dt);
        break;
      case 'PHASE_1':
        this.updatePhase1(dt);
        break;
      case 'TRANSITION':
        this.updateTransition(dt);
        break;
      case 'PHASE_2':
        this.updatePhase2(dt);
        break;
    }

    // Track hits taken during this frame (from boss attacks or boomerangs)
    if (this.player.health < healthBeforeBossUpdate) {
      this.stats.hitsTaken += healthBeforeBossUpdate - this.player.health;
      this.addCameraShake(14);
      this.triggerHitstop(0.06);
      gamepadManager.vibrate(150, 0.7, 0.9);
      if (this.onStateChange) this.onStateChange();
    }

    // Fin de partie si les points de vie atteignent 0
    if (this.player.health <= 0) {
      this.triggerGameOver();
      return;
    }
  }

  public triggerGameOver() {
    this.phase = 'GAMEOVER';
    this.scheduledActions = [];
    audio.stopMusic();
    audio.playPlayerHurt();
    this.addCameraShake(22);
    this.triggerHitstop(0.12);
    gamepadManager.vibrate(300, 0.8, 1.0);
    this.bannerText = 'DÉFAITE';
    this.bannerSubtext = 'L’Âme s’est éteinte dans la pénombre';
    this.bannerAlpha = 1.0;
    if (this.onStateChange) this.onStateChange();
  }

  // --- PHASE 1 (LORD 0) ---

  private updateIntroCinematic(dt: number) {
    this.lord0.update(dt, this.player, this.particles);
    this.transitionTimer -= dt;
    if (this.transitionTimer <= 0) {
      this.phase = 'PHASE_1';
      this.phase1AttackTimer = 0.6;
      if (this.onStateChange) this.onStateChange();
    }
  }

  private updatePhase1(dt: number) {
    // 1. Update Lord 0
    this.lord0.update(dt, this.player, this.particles);

    // 2. Check Player Nail Attack vs Lord 0
    this.checkPlayerAttackVsBoss(this.lord0);

    // 3. Check if Lord 0 defeated
    if (this.lord0.health <= 0 && this.lord0.state === 'KNEELING') {
      this.triggerPhaseTransition();
      return;
    }

    // 4. AI Attack Director for Lord 0
    if (this.lord0.state === 'IDLE_SHADOW' && this.lord0.idleDelay <= 0) {
      this.phase1AttackTimer -= dt;
      if (this.phase1AttackTimer <= 0) {
        this.phase1AttackTimer = 0.7 + Math.random() * 0.3;
        this.executePhase1Attack();
      }
    }
  }

  private executePhase1Attack() {
    const patterns = ['dash', 'dive', 'wall_low', 'wall_wave', 'dive', 'dash'];
    const chosen = patterns[this.phase1PatternIndex % patterns.length];
    this.phase1PatternIndex++;

    if (chosen === 'dash') {
      const fromLeft = Math.random() > 0.5;
      this.lord0.triggerDash(fromLeft);
    } else if (chosen === 'dive') {
      this.lord0.triggerDive(this.player.x);
    } else if (chosen === 'wall_low') {
      const side = this.player.x > CANVAS_WIDTH / 2 ? -1 : 1;
      this.lord0.triggerWallThrow(side, 'low');
    } else {
      const side = this.player.x > CANVAS_WIDTH / 2 ? -1 : 1;
      this.lord0.triggerWallThrow(side, 'wave');
    }
  }

  // --- TRANSITION TO PHASE 2 ---

  private triggerPhaseTransition() {
    this.phase = 'TRANSITION';
    this.transitionTimer = 3.2;
    this.addCameraShake(18);
    this.triggerHitstop(0.12);

    this.bannerText = 'SŒURS DE BATAILLE';
    this.bannerSubtext = 'Les deux seigneurs se dressent à l’unisson';
    this.bannerAlpha = 1.0;

    // Accelerate and intensify music
    audio.setPhase(2);

    if (this.onStateChange) this.onStateChange();
  }

  private updateTransition(dt: number) {
    this.transitionTimer -= dt;

    // Both sisters stand up and leap down together!
    if (this.transitionTimer <= 2.2 && this.lord1.state === 'ON_THRONE') {
      this.lord1.startIntroLeap();
      this.lord2.startIntroLeap();
      this.addCameraShake(10);
    }

    this.lord1.update(dt, this.player, this.particles);
    this.lord2.update(dt, this.player, this.particles);

    if (this.transitionTimer <= 0) {
      this.phase = 'PHASE_2';
      this.phase2RoutineTimer = 0.8;
      if (this.onStateChange) this.onStateChange();
    }
  }

  // --- PHASE 2 (DUAL SISTERS) ---

  private updatePhase2(dt: number) {
    // Process scheduled actions (frozen automatically during pause or game freeze)
    for (let i = this.scheduledActions.length - 1; i >= 0; i--) {
      const action = this.scheduledActions[i];
      action.delay -= dt;
      if (action.delay <= 0) {
        this.scheduledActions.splice(i, 1);
        action.fn();
      }
    }

    this.lord1.update(dt, this.player, this.particles);
    this.lord2.update(dt, this.player, this.particles);

    // Check player attacks against both sisters
    this.checkPlayerAttackVsBoss(this.lord1);
    this.checkPlayerAttackVsBoss(this.lord2);

    // Check Victory condition (both defeated!)
    if (this.lord1.health <= 0 && this.lord2.health <= 0) {
      this.triggerVictory();
      return;
    }

    // AI Dual Coordination
    this.phase2RoutineTimer -= dt;
    if (this.phase2RoutineTimer <= 0) {
      this.phase2RoutineTimer = 1.6 + Math.random() * 0.5;
      this.executePhase2Choreography();
    }
  }

  private scheduleAction(delaySeconds: number, fn: () => void) {
    this.scheduledActions.push({ delay: delaySeconds, fn });
  }

  private executePhase2Choreography() {
    const isL1Alive = this.lord1.health > 0;
    const isL2Alive = this.lord2.health > 0;

    // If only one sister remains alive, single boss aggression
    if (!isL1Alive && isL2Alive) {
      if (this.lord2.state === 'IDLE_SHADOW') {
        const move = Math.random();
        if (move < 0.35) this.lord2.triggerDash(Math.random() > 0.5);
        else if (move < 0.7) this.lord2.triggerDive(this.player.x);
        else this.lord2.triggerWallThrow(Math.random() > 0.5 ? 1 : -1, 'low');
      }
      return;
    }

    if (isL1Alive && !isL2Alive) {
      if (this.lord1.state === 'IDLE_SHADOW') {
        const move = Math.random();
        if (move < 0.35) this.lord1.triggerDash(Math.random() > 0.5);
        else if (move < 0.7) this.lord1.triggerDive(this.player.x);
        else this.lord1.triggerWallThrow(Math.random() > 0.5 ? 1 : -1, 'wave');
      }
      return;
    }

    // BOTH SISTERS ALIVE: Coordinated combos
    const comboType = this.phase2RoutineIndex % 4;
    this.phase2RoutineIndex++;

    if (comboType === 0) {
      // Combo 1: Dash & Dive combo (Sister 1 dashes ground, Sister 2 dives right after)
      this.lord1.triggerDash(true);
      this.scheduleAction(0.35, () => {
        if (this.phase === 'PHASE_2' && this.lord2.health > 0) {
          this.lord2.triggerDive(this.player.x);
        }
      });
    } else if (comboType === 1) {
      // Combo 2: Dual Wall Cling (Cross-cutting boomerangs from both walls!)
      this.lord1.triggerWallThrow(-1, 'low');
      this.lord2.triggerWallThrow(1, 'wave');
    } else if (comboType === 2) {
      // Combo 3: Staggered Dives (Double spear plunge!)
      this.lord1.triggerDive(this.player.x - 60);
      this.scheduleAction(0.40, () => {
        if (this.phase === 'PHASE_2' && this.lord2.health > 0) {
          this.lord2.triggerDive(this.player.x + 60);
        }
      });
    } else {
      // Combo 4: Pincer Ground Dash from opposite sides!
      this.lord1.triggerDash(true);
      this.scheduleAction(0.45, () => {
        if (this.phase === 'PHASE_2' && this.lord2.health > 0) {
          this.lord2.triggerDash(false);
        }
      });
    }
  }

  // --- VICTORY ---

  private triggerVictory() {
    this.phase = 'VICTORY';
    this.scheduledActions = [];
    this.addCameraShake(24);
    this.triggerHitstop(0.2);

    this.bannerText = 'TRIOMPHE DES MANTES';
    this.bannerSubtext = 'La tribu des Mantes s’incline avec respect';
    this.bannerAlpha = 1.0;

    audio.stopMusic();
    audio.playVictoryFanfare();
    gamepadManager.vibrate(350, 0.5, 0.8);

    // All three Mantis Lords bow gracefully
    this.lord0.state = 'KNEELING';
    this.lord1.state = 'KNEELING';
    this.lord2.state = 'KNEELING';

    // Radiant celebratory particles
    for (let i = 0; i < 50; i++) {
      this.particles.emitSoulFocus(CANVAS_WIDTH / 2, FLOOR_Y - 40);
    }

    if (this.onStateChange) this.onStateChange();
  }

  // --- NAIL COLLISION LOGIC ---

  private checkPlayerAttackVsBoss(boss: MantisLord) {
    if (!this.player.nailHitbox || this.player.hasHitCurrentAttack) return;

    const hitbox = boss.getHitbox();
    if (!hitbox) return;

    const n = this.player.nailHitbox;

    // AABB Collision test
    if (
      n.x < hitbox.x + hitbox.width &&
      n.x + n.width > hitbox.x &&
      n.y < hitbox.y + hitbox.height &&
      n.y + n.height > hitbox.y
    ) {
      this.player.hasHitCurrentAttack = true;

      // Check if Downward Pogo Attack!
      if (this.player.attackDirection === 'down') {
        this.player.onPogoBounce(this.particles);
        this.stats.pogosLanded++;
        this.addCameraShake(8);
        this.triggerHitstop(0.045);
        gamepadManager.vibrate(70, 0.4, 0.7);
      } else {
        const contactX = (n.x + hitbox.x + hitbox.width / 2) / 2;
        const contactY = (n.y + hitbox.y + hitbox.height / 2) / 2;
        this.player.onNailHitEnemy(this.particles, contactX, contactY);
        this.addCameraShake(6);
        this.triggerHitstop(0.035);
        gamepadManager.vibrate(45, 0.4, 0.3);
      }

      this.stats.hitsDealt++;
      boss.takeNailDamage(15, this.particles);

      if (this.onStateChange) this.onStateChange();
    }
  }

  // --- RENDER ---

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Décalage de tremblement de caméra
    if (this.phase !== 'TITLE' && this.shakeAmount > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeAmount;
      const shakeY = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Arena Cavern Background & Thrones
    this.arena.render(ctx, this.phase !== 'TITLE');

    // 2. Mantis Lords (rendered in proper depth order)
    this.lord0.render(ctx);
    this.lord1.render(ctx);
    this.lord2.render(ctx);

    // 3. Player Character
    if (this.phase !== 'TITLE') {
      this.player.render(ctx);
    }

    // 4. Particles, Sparks, Slashes & Shockwaves
    this.particles.render(ctx);

    // 5. Cinematic Banner Announcement (Title cards)
    if (this.bannerAlpha > 0 && this.bannerText) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.bannerAlpha);

      // Dark translucent ribbon behind text
      const ribbonGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      ribbonGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      ribbonGrad.addColorStop(0.2, 'rgba(15, 23, 42, 0.85)');
      ribbonGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.85)');
      ribbonGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = ribbonGrad;
      ctx.fillRect(0, 240, CANVAS_WIDTH, 110);

      // Gold filigree lines
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH * 0.25, 240);
      ctx.lineTo(CANVAS_WIDTH * 0.75, 240);
      ctx.moveTo(CANVAS_WIDTH * 0.3, 350);
      ctx.lineTo(CANVAS_WIDTH * 0.7, 350);
      ctx.stroke();

      // Main Banner Text
      ctx.font = '900 38px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fillText(this.bannerText, CANVAS_WIDTH / 2, 290);

      // Subtext
      ctx.font = '500 16px "Cinzel", serif';
      ctx.fillStyle = '#94a3b8';
      ctx.shadowBlur = 0;
      ctx.fillText(this.bannerSubtext, CANVAS_WIDTH / 2, 325);

      ctx.restore();
    }

    ctx.restore();
  }
}
