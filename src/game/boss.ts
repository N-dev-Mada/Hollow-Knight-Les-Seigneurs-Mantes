/**
 * The Mantis Lords boss logic, AI state machine, attacks, and vector rendering.
 * Faithfully recreates Phase 1 (Single Lord) and Phase 2 (The Sisters).
 */

import {
  CANVAS_WIDTH,
  FLOOR_Y,
  ARENA_LEFT,
  ARENA_RIGHT,
  Rect,
} from './types';
import { ParticleSystem } from './particles';
import { audio } from './audio';
import { Player } from './player';

export type MantisState =
  | 'ON_THRONE'
  | 'INTRO_LEAP'
  | 'IDLE_SHADOW'
  | 'PREPARE_DASH'
  | 'DASHING'
  | 'DASH_RECOVER'
  | 'PREPARE_DIVE'
  | 'DIVING'
  | 'DIVE_RECOVER'
  | 'PREPARE_WALL'
  | 'WALL_THROW'
  | 'KNEELING'
  | 'DEFEATED';

export interface Boomerang {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  farX: number;
  direction: 1 | -1;
  radius: number;
  rotation: number;
  timeAlive: number;
  duration: number;
  type: 'low' | 'wave';
  returning: boolean;
  trail: { x: number; y: number }[];
}

export class MantisLord {
  public id: number; // 0 = Center, 1 = Left Sister, 2 = Right Sister
  public name: string;
  public state: MantisState = 'ON_THRONE';
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 55;
  public height: number = 100;
  public facing: 1 | -1 = 1;

  // Health
  public maxHealth: number = 240;
  public health: number = 240;
  public isInvulnerable: boolean = false;
  public hitFlashTimer: number = 0;

  // AI & Attack Timers
  public stateTimer: number = 0;
  public idleDelay: number = 0.6;
  public targetX: number = 0;
  public targetY: number = 0;
  public wallSide: 1 | -1 = 1;

  // Attack specifics
  private dashSpeed: number = 1350;
  private diveSpeed: number = 1600;
  public boomerangs: Boomerang[] = [];
  private static nextBoomerangId = 1;

  // Visuals
  public eyeGleam: number = 0;
  private trailTimer: number = 0;
  public throneX: number = 0;
  public throneY: number = 150;

  constructor(id: number) {
    this.id = id;
    this.name = id === 0 ? 'Seigneur Mantis' : id === 1 ? 'Sœur Mante I' : 'Sœur Mante II';

    // Position of their thrones high in the cavern
    if (id === 0) {
      this.throneX = CANVAS_WIDTH / 2;
      this.throneY = 155;
      this.maxHealth = 260;
    } else if (id === 1) {
      this.throneX = CANVAS_WIDTH / 2 - 280;
      this.throneY = 165;
      this.maxHealth = 200;
    } else {
      this.throneX = CANVAS_WIDTH / 2 + 280;
      this.throneY = 165;
      this.maxHealth = 200;
    }

    this.reset();
  }

  public reset() {
    this.health = this.maxHealth;
    this.state = 'ON_THRONE';
    this.x = this.throneX;
    this.y = this.throneY;
    this.vx = 0;
    this.vy = 0;
    this.stateTimer = 0;
    this.boomerangs = [];
    this.hitFlashTimer = 0;
    this.isInvulnerable = false;
  }

  // --- ATTACK TRIGGER COMMANDS (Used by AI Director) ---

  public startIntroLeap() {
    this.state = 'INTRO_LEAP';
    this.stateTimer = 0;
    this.x = this.throneX;
    this.y = this.throneY;
    this.vx = (CANVAS_WIDTH / 2 - this.throneX) * 1.2;
    this.vy = -180;
    audio.playBossAppear();
  }

  public triggerDash(fromLeft: boolean) {
    this.state = 'PREPARE_DASH';
    this.stateTimer = 0.52; // Telegraph duration
    this.facing = fromLeft ? 1 : -1;
    this.x = fromLeft ? ARENA_LEFT + 40 : ARENA_RIGHT - 40 - this.width;
    this.y = FLOOR_Y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.eyeGleam = 1.0;
    audio.playBossAppear();
    audio.playBossTelegraph();
  }

  public triggerDive(playerX: number) {
    this.state = 'PREPARE_DIVE';
    this.stateTimer = 0.44; // Telegraph hover duration
    // Appear directly above player
    this.x = Math.max(ARENA_LEFT + 60, Math.min(ARENA_RIGHT - 60 - this.width, playerX - this.width / 2));
    this.y = 80;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.eyeGleam = 1.0;
    audio.playBossAppear();
    audio.playBossTelegraph();
  }

  public triggerWallThrow(wallSide: 1 | -1, arcType: 'low' | 'wave') {
    this.state = 'PREPARE_WALL';
    this.stateTimer = 0.48; // Telegraph cling duration
    this.wallSide = wallSide;
    this.facing = wallSide === 1 ? -1 : 1;
    this.x = wallSide === 1 ? ARENA_RIGHT - 75 : ARENA_LEFT + 25;
    this.y = 330;
    this.vx = 0;
    this.vy = 0;
    this.eyeGleam = 1.0;
    this.targetX = arcType === 'low' ? 0 : 1; // stash type
    audio.playBossAppear();
    audio.playBossTelegraph();
  }

  // --- UPDATE ---

  public update(dt: number, player: Player, particles: ParticleSystem) {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    if (this.eyeGleam > 0) {
      this.eyeGleam = Math.max(0, this.eyeGleam - dt * 2.5);
    }

    // Update Boomerangs
    this.updateBoomerangs(dt, player, particles);

    // If kneeling or defeated, do nothing else
    if (this.state === 'KNEELING' || this.state === 'DEFEATED' || this.state === 'ON_THRONE') {
      return;
    }

    // State Machine
    switch (this.state) {
      case 'INTRO_LEAP': {
        this.vy += 1200 * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.y + this.height >= FLOOR_Y) {
          this.y = FLOOR_Y - this.height;
          this.vy = 0;
          this.vx = 0;
          this.state = 'IDLE_SHADOW';
          this.idleDelay = 0.5;
          particles.emitShockwave(this.x + this.width / 2, FLOOR_Y, 70, '#f59e0b');
          particles.emitDust(this.x + this.width / 2, FLOOR_Y, 12, 0);
          audio.playBossDiveImpact();
        }
        break;
      }

      case 'IDLE_SHADOW': {
        this.idleDelay -= dt;
        // In shadow, Mantis is offscreen/above ceiling waiting for director to call next attack
        break;
      }

      case 'PREPARE_DASH': {
        this.stateTimer -= dt;
        // Slight lean back preparation
        if (this.stateTimer <= 0) {
          this.state = 'DASHING';
          this.vx = this.facing * this.dashSpeed;
          audio.playBossDash();
          particles.emitDust(this.x + this.width / 2, FLOOR_Y, 8, -this.facing);
        }
        break;
      }

      case 'DASHING': {
        this.x += this.vx * dt;

        // Ghosting afterimage
        this.trailTimer += dt;
        if (this.trailTimer > 0.035) {
          this.trailTimer = 0;
          particles.addAfterimage(this.x, this.y, this.facing, 1, 1, 'dash', 'rgba(245, 158, 11, 0.45)');
        }

        // Check if reached other wall
        const reachedTarget =
          (this.facing === 1 && this.x + this.width >= ARENA_RIGHT - 40) ||
          (this.facing === -1 && this.x <= ARENA_LEFT + 40);

        if (reachedTarget) {
          this.state = 'DASH_RECOVER';
          this.stateTimer = 0.22;
          this.vx = 0;
          particles.emitDust(this.x + this.width / 2, FLOOR_Y, 6, this.facing);
        }
        break;
      }

      case 'DASH_RECOVER': {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          // Leap back into shadows
          this.retreatToShadows(particles);
        }
        break;
      }

      case 'PREPARE_DIVE': {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'DIVING';
          this.vy = this.diveSpeed;
          audio.playBossDash();
        }
        break;
      }

      case 'DIVING': {
        this.y += this.vy * dt;

        // Ghosting afterimage
        this.trailTimer += dt;
        if (this.trailTimer > 0.03) {
          this.trailTimer = 0;
          particles.addAfterimage(this.x, this.y, 1, 1, 1, 'dive', 'rgba(239, 68, 68, 0.4)');
        }

        // Slam into floor
        if (this.y + this.height >= FLOOR_Y) {
          this.y = FLOOR_Y - this.height;
          this.vy = 0;
          this.state = 'DIVE_RECOVER';
          this.stateTimer = 0.38; // Vulnerability window!

          // Visual and audio impact
          audio.playBossDiveImpact();
          particles.emitShockwave(this.x + this.width / 2, FLOOR_Y, 110, '#f59e0b');
          particles.emitSparks(this.x + this.width / 2, FLOOR_Y, 20, false);
          particles.emitDust(this.x + this.width / 2, FLOOR_Y, 16, 0);
        }
        break;
      }

      case 'DIVE_RECOVER': {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.retreatToShadows(particles);
        }
        break;
      }

      case 'PREPARE_WALL': {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'WALL_THROW';
          this.stateTimer = 4.0; // Stays on wall until boomerang completes round-trip
          this.spawnBoomerang(this.targetX === 0 ? 'low' : 'wave');
        }
        break;
      }

      case 'WALL_THROW': {
        this.stateTimer -= dt;
        if (this.boomerangs.length === 0 || this.stateTimer <= 0) {
          this.retreatToShadows(particles);
        }
        break;
      }
    }

    // Check Player collisions while attacking
    this.checkPlayerDamageCollision(player, particles);
  }

  private retreatToShadows(particles: ParticleSystem) {
    this.state = 'IDLE_SHADOW';
    this.idleDelay = 0.6 + Math.random() * 0.4;
    particles.emitDust(this.x + this.width / 2, this.y + this.height, 4, 0);
    // Move offscreen into high ceiling
    this.y = -200;
  }

  // --- BOOMERANG LOGIC ---

  private spawnBoomerang(type: 'low' | 'wave') {
    audio.playBoomerangThrow();
    const dir = this.facing;
    const startX = this.x + (dir === 1 ? this.width + 12 : -12);
    const startY = this.y + 40;
    const farX = dir === 1 ? ARENA_RIGHT - 80 : ARENA_LEFT + 80;
    const duration = 1.35; // One-way flight time in seconds

    this.boomerangs.push({
      id: MantisLord.nextBoomerangId++,
      x: startX,
      y: startY,
      startX,
      startY,
      farX,
      direction: dir,
      radius: 30,
      rotation: 0,
      timeAlive: 0,
      duration,
      type,
      returning: false,
      trail: [{ x: startX, y: startY }],
    });
  }

  private updateBoomerangs(dt: number, player: Player, particles: ParticleSystem) {
    for (let i = this.boomerangs.length - 1; i >= 0; i--) {
      const b = this.boomerangs[i];
      b.timeAlive += dt;
      b.rotation += dt * 26; // High-speed spin

      const t = b.timeAlive / b.duration;

      if (t < 1.0) {
        // --- Outward trajectory from startX to farX ---
        b.returning = false;
        const p = t;
        b.x = b.startX + (b.farX - b.startX) * p;

        if (b.type === 'low') {
          // Parabolic dip to floor level, skimming floor across center of room
          const floorDip = FLOOR_Y - 32 - b.startY;
          b.y = b.startY + floorDip * Math.sin(p * Math.PI);

          // Eject sparks and dust when skimming the stone floor
          if (b.y >= FLOOR_Y - 45) {
            particles.emitDust(b.x, FLOOR_Y, 1, -b.direction);
            if (Math.random() < 0.3) {
              particles.emitSparks(b.x, FLOOR_Y, 2, false);
            }
          }
        } else {
          // Wave trajectory: smooth double-sine undulation
          b.y = b.startY + Math.sin(p * Math.PI * 2) * 135;
        }

        // Add to subtle kinetic wake
        if (!b.trail) b.trail = [];
        b.trail.unshift({ x: b.x, y: b.y });
        if (b.trail.length > 8) b.trail.pop();

      } else {
        // --- Return trajectory from farX back to startX ---
        const r = t - 1.0;

        // Instant of turnaround at far wall: trigger impact VFX once
        if (!b.returning) {
          b.returning = true;
          particles.emitSparks(b.farX, b.startY, 16, false);
          particles.emitShockwave(b.farX, b.startY, 50, '#f59e0b');
          audio.playNailHitWall();
        }

        if (r >= 1.0) {
          // Reached Mantis hand! Catch animation & particle burst
          particles.emitSparks(b.startX, b.startY, 14, false);
          particles.emitShockwave(b.startX, b.startY, 35, '#fef08a');
          audio.playNailHitWall();
          this.boomerangs.splice(i, 1);
          continue;
        }

        b.x = b.farX + (b.startX - b.farX) * r;

        if (b.type === 'low') {
          // Returns along upper trajectory across hall so Knight can run or pogo
          b.y = b.startY - 75 * Math.sin(r * Math.PI);
        } else {
          // Return wave in opposite vertical phase
          b.y = b.startY - Math.sin(r * Math.PI * 2) * 135;
        }

        // Add to subtle kinetic wake
        if (!b.trail) b.trail = [];
        b.trail.unshift({ x: b.x, y: b.y });
        if (b.trail.length > 8) b.trail.pop();
      }

      // Check collision with player
      const dist = Math.hypot(b.x - (player.x + player.width / 2), b.y - (player.y + player.height / 2));
      if (dist < b.radius + 18) {
        player.takeDamage(1, b.returning ? -b.direction : b.direction, particles);
      }

      // Check player DOWN ATTACK POGO on Boomerang!
      if (player.nailHitbox && player.attackDirection === 'down' && !player.hasHitCurrentAttack) {
        if (
          player.nailHitbox.x < b.x + b.radius &&
          player.nailHitbox.x + player.nailHitbox.width > b.x - b.radius &&
          player.nailHitbox.y < b.y + b.radius &&
          player.nailHitbox.y + player.nailHitbox.height > b.y - b.radius
        ) {
          player.hasHitCurrentAttack = true;
          player.onPogoBounce(particles);
        }
      }
    }
  }

  // --- PLAYER COLLISION & DAMAGE TAKEN ---

  private checkPlayerDamageCollision(player: Player, particles: ParticleSystem) {
    if (this.state === 'IDLE_SHADOW' || this.state === 'KNEELING' || this.state === 'DEFEATED') return;

    // Boss body contact damage
    const bossRect: Rect = {
      x: this.x + 8,
      y: this.y + 10,
      width: this.width - 16,
      height: this.height - 10,
    };

    if (
      player.x < bossRect.x + bossRect.width &&
      player.x + player.width > bossRect.x &&
      player.y < bossRect.y + bossRect.height &&
      player.y + player.height > bossRect.y
    ) {
      const knockDir = player.x < this.x + this.width / 2 ? -1 : 1;
      player.takeDamage(1, knockDir, particles);
    }
  }

  public takeNailDamage(damage: number, particles: ParticleSystem): boolean {
    if (this.state === 'IDLE_SHADOW' || this.state === 'ON_THRONE' || this.state === 'KNEELING' || this.state === 'DEFEATED') {
      return false;
    }

    this.health = Math.max(0, this.health - damage);
    this.hitFlashTimer = 0.12;

    if (this.health <= 0) {
      // Defeated! Kneel gracefully
      this.state = 'KNEELING';
      this.y = FLOOR_Y - this.height;
      this.vx = 0;
      this.vy = 0;
      particles.emitShockwave(this.x + this.width / 2, FLOOR_Y, 80, '#fef08a');
      particles.emitSparks(this.x + this.width / 2, this.y + 40, 26, true);
      return true;
    }

    return false;
  }

  public getHitbox(): Rect | null {
    if (this.state === 'IDLE_SHADOW' || this.state === 'ON_THRONE' || this.state === 'KNEELING' || this.state === 'DEFEATED') {
      return null;
    }
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  // --- RENDER ---

  public render(ctx: CanvasRenderingContext2D) {
    // Render Boomerangs first (so they are visible regardless of Mantis state)
    this.renderBoomerangs(ctx);

    // If in shadow, do not draw
    if (this.state === 'IDLE_SHADOW') return;

    ctx.save();

    // Hit flash (white silhouette)
    const isFlashing = this.hitFlashTimer > 0;

    if (this.state === 'ON_THRONE') {
      this.renderThroneSitting(ctx);
    } else {
      this.renderActiveMantis(ctx, isFlashing);
    }

    ctx.restore();
  }

  private renderBoomerangs(ctx: CanvasRenderingContext2D) {
    for (const b of this.boomerangs) {
      // 1. Draw glowing motion trail ribbon behind the flying disc
      if (b.trail && b.trail.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glowing fiery aura
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 14;
        ctx.stroke();

        // Intense blade trail ribbon
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 7;
        ctx.stroke();

        // White-hot inner core streak (closest to the spinning disc)
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < Math.min(b.trail.length, 5); i++) {
          ctx.lineTo(b.trail[i].x, b.trail[i].y);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
      }

      // 2. Draw the spinning razor disc itself
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      // Outer glowing fire aura
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, b.radius * 1.4);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.85)');
      grad.addColorStop(0.75, 'rgba(220, 38, 38, 0.5)');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Curved triple razor blades (shuriken/boomerang geometry)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;

      for (let blade = 0; blade < 3; blade++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(b.radius * 0.7, -10, b.radius, 0);
        ctx.quadraticCurveTo(b.radius * 0.5, 10, 0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Center glowing core
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderThroneSitting(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.throneX, this.throneY);

    // Slender insect silhouette seated
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;

    // Body & Cloak
    ctx.beginPath();
    ctx.moveTo(-16, 20);
    ctx.lineTo(-12, -40);
    ctx.lineTo(12, -40);
    ctx.lineTo(16, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mantis Head & Crest
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(0, -55, 9, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Curved Horns / Antennas
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-4, -65);
    ctx.quadraticCurveTo(-14, -80, -20, -95);
    ctx.moveTo(4, -65);
    ctx.quadraticCurveTo(14, -80, 20, -95);
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = this.id === 0 ? '#f59e0b' : '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(-4, -54, 2.2, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(4, -54, 2.2, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Resting Lance resting diagonally
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 25);
    ctx.lineTo(34, -75);
    ctx.stroke();

    // Lance blade
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(34, -75);
    ctx.lineTo(44, -115);
    ctx.lineTo(30, -78);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderActiveMantis(ctx: CanvasRenderingContext2D, isFlashing: boolean) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height);

    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    if (isFlashing) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
    }

    // 1. KNEELING POSE
    if (this.state === 'KNEELING') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      // Kneeling legs
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(12, 0);
      ctx.lineTo(18, -25);
      ctx.lineTo(-5, -30);
      ctx.closePath();
      ctx.fill();

      // Bent thorax bowing forward
      ctx.beginPath();
      ctx.moveTo(-5, -30);
      ctx.quadraticCurveTo(15, -45, 25, -55);
      ctx.lineTo(15, -65);
      ctx.lineTo(-12, -45);
      ctx.closePath();
      ctx.fill();

      // Head bowed down
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.beginPath();
      ctx.ellipse(32, -60, 8, 14, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Lance laid on ground in sign of respect
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-35, -2);
      ctx.lineTo(65, -2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 2. WALL CLING POSE
    if (this.state === 'PREPARE_WALL' || this.state === 'WALL_THROW') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      // Legs gripped on wall behind
      ctx.beginPath();
      ctx.moveTo(-15, -80);
      ctx.lineTo(-32, -85);
      ctx.lineTo(-32, -40);
      ctx.lineTo(-15, -45);
      ctx.stroke();

      // Slender insect torso angled outwards
      ctx.beginPath();
      ctx.moveTo(-12, -90);
      ctx.lineTo(8, -85);
      ctx.lineTo(16, -30);
      ctx.lineTo(-8, -25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head looking into arena
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.beginPath();
      ctx.ellipse(14, -95, 9, 16, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Curved Horns
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(12, -108);
      ctx.quadraticCurveTo(24, -125, 34, -140);
      ctx.moveTo(18, -106);
      ctx.quadraticCurveTo(34, -122, 46, -135);
      ctx.stroke();

      // Glowing Eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(16, -94, 2.5, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Spinning charged miniature glaive in outstretched claw during PREPARE_WALL
      if (this.state === 'PREPARE_WALL') {
        ctx.save();
        ctx.translate(26, -55);
        const chargeProg = Math.max(0.2, 1 - (this.stateTimer / 0.48));
        ctx.rotate(chargeProg * Math.PI * 12);

        // Radiant charge aura
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, 18 * chargeProg, 0, Math.PI * 2);
        ctx.fill();

        // Mini 3-blade disc
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 1.5;
        for (let b = 0; b < 3; b++) {
          ctx.rotate((Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(15 * chargeProg, -4);
          ctx.lineTo(10 * chargeProg, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      return;
    }

    // 3. DIVE POSE (Vertical downward spear plunge)
    if (this.state === 'PREPARE_DIVE' || this.state === 'DIVING') {
      ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;

      // Body aligned vertically
      ctx.beginPath();
      ctx.ellipse(0, -60, 10, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head facing downward
      ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
      ctx.beginPath();
      ctx.ellipse(0, -25, 9, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Twin lances pointing straight down past head!
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-8, -75);
      ctx.lineTo(-8, 12);
      ctx.moveTo(8, -75);
      ctx.lineTo(8, 12);
      ctx.stroke();

      // Glowing blade tips
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-8, 18);
      ctx.lineTo(-5, 0);
      ctx.moveTo(5, 0);
      ctx.lineTo(8, 18);
      ctx.lineTo(11, 0);
      ctx.fill();

      // Glaring Eye
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -22, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    // 4. GROUND DASH & DEFAULT COMBAT POSE
    ctx.fillStyle = isFlashing ? '#ffffff' : '#1e293b';
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 2;

    const isDashing = this.state === 'DASHING' || this.state === 'PREPARE_DASH';
    const lean = isDashing ? 0.35 : 0;

    // Legs / Lower abdomen
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-8, -35);
    ctx.lineTo(12, -35);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thorax & Carapace
    ctx.save();
    ctx.rotate(lean);

    ctx.beginPath();
    ctx.moveTo(-12, -35);
    ctx.lineTo(-14, -75);
    ctx.lineTo(14, -75);
    ctx.lineTo(12, -35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mantis Head & Crowned Crest
    ctx.fillStyle = isFlashing ? '#ffffff' : '#334155';
    ctx.beginPath();
    ctx.ellipse(0, -88, 10, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Long sweeping crest horns
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#64748b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-5, -100);
    ctx.quadraticCurveTo(-15, -120, -24, -135);
    ctx.moveTo(5, -100);
    ctx.quadraticCurveTo(15, -120, 24, -135);
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = this.eyeGleam > 0 ? '#fef08a' : '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(4, -86, 2.5, 5, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Twin Lances
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#e2e8f0';
    ctx.lineWidth = 3.5;

    if (isDashing) {
      // Pointed forward in full horizontal thrust
      ctx.beginPath();
      ctx.moveTo(-5, -60);
      ctx.lineTo(65, -55);
      ctx.moveTo(5, -50);
      ctx.lineTo(75, -45);
      ctx.stroke();

      // Razor Lance blade edges
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(60, -58);
      ctx.lineTo(82, -55);
      ctx.lineTo(60, -52);
      ctx.moveTo(70, -48);
      ctx.lineTo(92, -45);
      ctx.lineTo(70, -42);
      ctx.fill();
    } else {
      // Resting battle guard
      ctx.beginPath();
      ctx.moveTo(5, -55);
      ctx.lineTo(25, -115);
      ctx.moveTo(-5, -50);
      ctx.lineTo(15, -110);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}
