/**
 * The Knight player character.
 * Implements tight Hollow Knight platforming physics, Nail slashing, Pogo bounces, Dash, and Focus healing.
 */

import {
  FLOOR_Y,
  ARENA_LEFT,
  ARENA_RIGHT,
  MAX_PLAYER_HEALTH,
  MAX_SOUL,
  SOUL_PER_HIT,
  SOUL_COST_HEAL,
  InputState,
  Rect,
} from './types';
import { ParticleSystem } from './particles';
import { audio } from './audio';

export class Player {
  // Position & physics
  public x: number = 300;
  public y: number = FLOOR_Y - 50;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 32;
  public height: number = 48;
  public facing: 1 | -1 = 1;
  public isGrounded: boolean = true;

  // Constants
  private readonly runSpeed = 430;
  private readonly accel = 2800;
  private readonly friction = 2200;
  private readonly gravity = 1950;
  private readonly jumpForce = -680;

  // Jump helpers (Coyote time & Jump buffer)
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private jumpHeld: boolean = false;

  // Dash
  public isDashing: boolean = false;
  private dashTimer: number = 0;
  private readonly dashDuration = 0.18;
  private readonly dashSpeed = 1150;
  private dashCooldown: number = 0;
  private readonly dashCooldownDuration = 0.52;
  private dashTrailTimer: number = 0;

  // Attack (Nail)
  public isAttacking: boolean = false;
  public attackTimer: number = 0;
  private readonly attackDuration = 0.22;
  private attackCooldown: number = 0;
  private readonly attackCooldownDuration = 0.32;
  public attackDirection: 'horizontal' | 'up' | 'down' = 'horizontal';
  public nailHitbox: Rect | null = null;
  public hasHitCurrentAttack: boolean = false;

  // Focus (Healing)
  public isFocusing: boolean = false;
  public focusTimer: number = 0;
  private readonly focusDuration = 1.1;

  // Stats
  public health: number = MAX_PLAYER_HEALTH;
  public soul: number = 40; // Starts with a bit of soul
  public isInvincible: boolean = false;
  public invincibilityTimer: number = 0;
  public flashTimer: number = 0;

  // Visuals
  public cloakSway: number = 0;
  public walkCycle: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.x = 320;
    this.y = FLOOR_Y - this.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.health = MAX_PLAYER_HEALTH;
    this.soul = 40;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.nailHitbox = null;
    this.isFocusing = false;
    this.focusTimer = 0;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
  }

  // --- UPDATE ---

  public update(dt: number, input: InputState, particles: ParticleSystem) {
    // 1. Invincibility & Dash timers
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }
    this.flashTimer += dt * 30;

    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // 2. Dash state logic
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.facing * this.dashSpeed;
      this.vy = 0;

      // Dash ghost trail
      this.dashTrailTimer += dt;
      if (this.dashTrailTimer > 0.04) {
        this.dashTrailTimer = 0;
        particles.addAfterimage(
          this.x,
          this.y,
          this.facing,
          1,
          1,
          'dash',
          'rgba(255, 255, 255, 0.45)'
        );
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx *= 0.4;
      }
    }

    // 3. Focus / Healing logic
    if (input.focus && !input.left && !input.right && this.isGrounded && !this.isDashing && !this.isAttacking && this.health < MAX_PLAYER_HEALTH && this.soul >= SOUL_COST_HEAL) {
      if (!this.isFocusing) {
        this.isFocusing = true;
        this.focusTimer = 0;
        audio.startFocusGather();
      }

      // Immobilize while focusing
      this.vx = 0;
      this.focusTimer += dt;
      particles.emitSoulFocus(this.x + this.width / 2, this.y + this.height / 2);

      if (this.focusTimer >= this.focusDuration) {
        // Complete heal!
        this.health = Math.min(MAX_PLAYER_HEALTH, this.health + 1);
        this.soul -= SOUL_COST_HEAL;
        this.focusTimer = 0;
        this.isFocusing = false;
        audio.playFocusHeal();
        particles.emitHealBurst(this.x + this.width / 2, this.y + this.height / 2);
      }
    } else {
      if (this.isFocusing) {
        this.isFocusing = false;
        this.focusTimer = 0;
        audio.stopFocusGather();
      }
    }

    // 4. Horizontal movement (if not dashing and not focusing)
    if (!this.isDashing && !this.isFocusing) {
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;

      if (moveDir !== 0) {
        this.facing = moveDir as 1 | -1;
        this.vx += moveDir * this.accel * dt;
        if (Math.abs(this.vx) > this.runSpeed) {
          this.vx = moveDir * this.runSpeed;
        }
        this.walkCycle += dt * 14;

        if (this.isGrounded && Math.random() < 0.25) {
          particles.emitDust(this.x + this.width / 2, this.y + this.height, 1, -moveDir);
        }
      } else {
        // Friction / deceleration
        if (this.vx > 0) {
          this.vx = Math.max(0, this.vx - this.friction * dt);
        } else if (this.vx < 0) {
          this.vx = Math.min(0, this.vx + this.friction * dt);
        }
        this.walkCycle = 0;
      }
    }

    // 5. Jump logic with coyote time & jump buffering
    if (this.isGrounded) {
      this.coyoteTimer = 0.1;
    } else {
      this.coyoteTimer -= dt;
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.12;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Trigger jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isDashing && !this.isFocusing) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.jumpHeld = true;
      audio.playJump();
      particles.emitDust(this.x + this.width / 2, this.y + this.height, 5, 0);
    }

    // Variable jump cut
    if (!input.jump && this.vy < -120 && this.jumpHeld) {
      this.vy *= 0.52;
      this.jumpHeld = false;
    }

    // 6. Dash activation
    if (input.dashPressed && this.dashCooldown <= 0 && !this.isDashing && !this.isFocusing) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = this.dashCooldownDuration;
      this.dashTrailTimer = 0;
      this.isInvincible = true;
      this.invincibilityTimer = this.dashDuration + 0.05; // i-frames cover dash
      audio.playDash();
      particles.emitDust(this.x + this.width / 2, this.y + this.height, 8, -this.facing);
    }

    // 7. Nail Attack
    if (input.attackPressed && this.attackCooldown <= 0 && !this.isDashing && !this.isFocusing) {
      this.isAttacking = true;
      this.attackTimer = this.attackDuration;
      this.attackCooldown = this.attackCooldownDuration;
      this.hasHitCurrentAttack = false;

      // Determine attack direction
      if (!this.isGrounded && input.down) {
        this.attackDirection = 'down';
      } else if (input.up) {
        this.attackDirection = 'up';
      } else {
        this.attackDirection = 'horizontal';
      }

      audio.playNailSwing(this.attackDirection);

      // Create visual slash arc
      const slashX = this.attackDirection === 'horizontal' ? (this.facing === 1 ? this.x + this.width + 12 : this.x - 12) : this.x + this.width / 2;
      const slashY = this.attackDirection === 'up' ? this.y - 15 : this.attackDirection === 'down' ? this.y + this.height + 15 : this.y + this.height / 2;
      const dirName = this.attackDirection === 'horizontal' ? (this.facing === 1 ? 'right' : 'left') : this.attackDirection;
      particles.addSlash(slashX, slashY, dirName as 'left' | 'right' | 'up' | 'down', 60);
    }

    // Attack cooldown & Hitbox lifetime
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer > 0.05 && this.attackTimer < this.attackDuration - 0.02) {
        // Active hitbox window
        if (this.attackDirection === 'horizontal') {
          this.nailHitbox = {
            x: this.facing === 1 ? this.x + this.width - 5 : this.x - 65,
            y: this.y - 8,
            width: 70,
            height: 58,
          };
        } else if (this.attackDirection === 'up') {
          this.nailHitbox = {
            x: this.x - 14,
            y: this.y - 58,
            width: 60,
            height: 60,
          };
        } else {
          // Downward (POGO) hitbox
          this.nailHitbox = {
            x: this.x - 14,
            y: this.y + this.height - 4,
            width: 60,
            height: 58,
          };
        }
      } else {
        this.nailHitbox = null;
      }

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.nailHitbox = null;
      }
    }

    // 8. Apply gravity (if not dashing)
    if (!this.isDashing) {
      this.vy += this.gravity * dt;
      if (this.vy > 1200) this.vy = 1200; // Terminal velocity
    }

    // 9. Position integration & Collision with Floor and Arena Bounds
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Floor collision
    if (this.y + this.height >= FLOOR_Y) {
      if (!this.isGrounded && this.vy > 250) {
        particles.emitDust(this.x + this.width / 2, FLOOR_Y, 5, 0);
      }
      this.y = FLOOR_Y - this.height;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Arena walls
    if (this.x < ARENA_LEFT) {
      this.x = ARENA_LEFT;
      this.vx = 0;
    } else if (this.x + this.width > ARENA_RIGHT) {
      this.x = ARENA_RIGHT - this.width;
      this.vx = 0;
    }

    // Cloak physics sway
    const targetSway = -this.vx * 0.04;
    this.cloakSway += (targetSway - this.cloakSway) * 0.18;
  }

  // --- POGO REBOUND & ON-HIT REWARD ---

  public onPogoBounce(particles: ParticleSystem) {
    this.vy = -560; // Strong upward bounce
    this.dashCooldown = 0; // Reset dash cooldown!
    this.addSoul(SOUL_PER_HIT);
    audio.playNailPogo();
    particles.emitSparks(this.x + this.width / 2, this.y + this.height, 22, true);
    particles.emitShockwave(this.x + this.width / 2, this.y + this.height, 45, '#38bdf8');
  }

  public onNailHitEnemy(particles: ParticleSystem, targetX: number, targetY: number) {
    this.addSoul(SOUL_PER_HIT);
    audio.playNailHitEnemy();
    particles.emitSparks(targetX, targetY, 16, false);

    // Subtle recoil for the Knight
    if (this.attackDirection === 'horizontal') {
      this.vx = -this.facing * 180;
    }
  }

  public addSoul(amount: number) {
    this.soul = Math.min(MAX_SOUL, this.soul + amount);
  }

  public takeDamage(damage: number, knockbackDir: number, particles: ParticleSystem): boolean {
    if (this.isInvincible) return false;

    this.health = Math.max(0, this.health - damage);
    // Soul gained on taking damage (Chant des Larves / Grubsong mechanic)
    this.addSoul(10);
    this.isInvincible = true;
    this.invincibilityTimer = 1.3; // Generous i-frames
    this.isFocusing = false; // Interrupted
    audio.stopFocusGather();

    // Knockback
    this.vx = knockbackDir * 320;
    this.vy = -280;

    audio.playPlayerHurt();
    particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 20, false);
    return true;
  }

  // --- RENDER ---

  public render(ctx: CanvasRenderingContext2D) {
    // If invincible and flashing, alternate draw to show i-frames
    if (this.isInvincible && Math.sin(this.flashTimer) > 0.1) {
      ctx.globalAlpha = 0.45;
    } else {
      ctx.globalAlpha = 1.0;
    }

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height);

    // Scale horizontally based on facing
    ctx.scale(this.facing, 1);

    // 1. Flowing Dark Indigo Cloak (behind body)
    ctx.save();
    ctx.fillStyle = '#1e1e2f';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;

    const sway = this.cloakSway;
    const walkBounce = Math.sin(this.walkCycle) * 2;

    ctx.beginPath();
    ctx.moveTo(-10, -28 + walkBounce);
    ctx.bezierCurveTo(-18 + sway, -14, -20 + sway * 1.5, -4, -14 + sway * 1.8, 0);
    ctx.lineTo(12, 0);
    ctx.bezierCurveTo(16, -6, 12, -20, 10, -28 + walkBounce);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner cloak shadow folds
    ctx.fillStyle = '#151522';
    ctx.beginPath();
    ctx.moveTo(-5, -24 + walkBounce);
    ctx.lineTo(-10 + sway, -2);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. The Knight's White Insect Mask / Head
    ctx.save();
    ctx.translate(0, -32 + walkBounce);

    // Mask shadow/outline
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Left horn
    ctx.moveTo(-4, -14);
    ctx.bezierCurveTo(-10, -26, -18, -32, -15, -42);
    ctx.bezierCurveTo(-9, -38, -6, -26, -2, -18);
    // Crest between horns
    ctx.quadraticCurveTo(0, -20, 2, -18);
    // Right horn
    ctx.bezierCurveTo(6, -26, 9, -38, 15, -42);
    ctx.bezierCurveTo(18, -32, 10, -26, 4, -14);
    // Main oval head
    ctx.bezierCurveTo(16, -10, 16, 8, 0, 10);
    ctx.bezierCurveTo(-16, 8, -16, -10, -4, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing black/dark void eyes
    ctx.fillStyle = '#05070c';
    // Left eye
    ctx.beginPath();
    ctx.ellipse(-6, -2, 3.8, 6.2, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(6, -2, 3.8, 6.2, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Focus glow in eyes
    if (this.isFocusing) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.beginPath();
      ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. The Nail (needle-sword)
    if (!this.isFocusing) {
      ctx.save();
      ctx.translate(8, -18);

      let nailAngle = 0.3;
      if (this.isAttacking) {
        if (this.attackDirection === 'horizontal') {
          nailAngle = (1 - this.attackTimer / this.attackDuration) * 1.8 - 0.4;
        } else if (this.attackDirection === 'up') {
          nailAngle = -1.2;
        } else if (this.attackDirection === 'down') {
          nailAngle = 1.9;
        }
      }

      ctx.rotate(nailAngle);

      // Handle & guard
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-2, -2, 4, 10);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-6, 8, 12, 3);

      // Silvery tapered blade
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-4, 11);
      ctx.lineTo(-2, 38);
      ctx.lineTo(0, 44); // Tip
      ctx.lineTo(2, 38);
      ctx.lineTo(4, 11);
      ctx.closePath();
      ctx.fill();

      // Blade ridge line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(0, 42);
      ctx.stroke();

      ctx.restore();
    }

    // 4. Focus healing aura (around knight)
    if (this.isFocusing) {
      const pulse = 1 + Math.sin(this.focusTimer * 12) * 0.15;
      const grad = ctx.createRadialGradient(0, -25, 10, 0, -25, 45 * pulse);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -25, 45 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
