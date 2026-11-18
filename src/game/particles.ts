/**
 * Particle and visual effects system for Mantis Lords.
 * Handles sparks, shockwaves, dust, soul motes, afterimages, and slash arcs.
 */

import { Particle, Shockwave, Afterimage, SlashEffect, FLOOR_Y } from './types';

export class ParticleSystem {
  public particles: Particle[] = [];
  public shockwaves: Shockwave[] = [];
  public afterimages: Afterimage[] = [];
  public slashes: SlashEffect[] = [];

  // Ambient cavern dust motes
  public ambientDust: { x: number; y: number; size: number; speed: number; alpha: number; phase: number }[] = [];

  constructor() {
    this.initAmbientDust();
  }

  private initAmbientDust() {
    this.ambientDust = [];
    for (let i = 0; i < 45; i++) {
      this.ambientDust.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: 1 + Math.random() * 2.5,
        speed: 8 + Math.random() * 15,
        alpha: 0.2 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  public reset() {
    this.particles = [];
    this.shockwaves = [];
    this.afterimages = [];
    this.slashes = [];
  }

  // --- SPAWN METHODS ---

  /** Golden/white sparks on sword collision or pogo */
  public emitSparks(x: number, y: number, count: number = 18, isPogo: boolean = false) {
    const baseColor = isPogo ? '#fef08a' : '#fde047';
    for (let i = 0; i < count; i++) {
      const angle = isPogo ? (Math.PI * 0.25 + Math.random() * Math.PI * 0.5) : (Math.random() * Math.PI * 2);
      const speed = isPogo ? (180 + Math.random() * 380) : (120 + Math.random() * 320);
      const life = 0.25 + Math.random() * 0.35;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (isPogo ? (Math.random() > 0.5 ? 1 : -1) : 1),
        vy: -Math.abs(Math.sin(angle) * speed),
        color: Math.random() > 0.3 ? baseColor : '#ffffff',
        size: 2 + Math.random() * 2.5,
        alpha: 1,
        decay: 1 / life,
        gravity: 980,
        bounce: true,
        life,
        maxLife: life,
        shape: 'spark',
      });
    }
  }

  /** Dust cloud on footsteps, landing, or dash */
  public emitDust(x: number, y: number, count: number = 6, direction: number = 0) {
    for (let i = 0; i < count; i++) {
      const life = 0.3 + Math.random() * 0.3;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y - 2,
        vx: direction * speed + (Math.random() - 0.5) * 30,
        vy: -(15 + Math.random() * 35),
        color: '#64748b',
        size: 4 + Math.random() * 6,
        alpha: 0.6,
        decay: 1 / life,
        gravity: 50,
        life,
        maxLife: life,
        shape: 'circle',
      });
    }
  }

  /** Expanding circular shockwave (boss dive impact or heavy landing) */
  public emitShockwave(x: number, y: number, maxRadius: number = 130, color: string = '#f59e0b') {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      width: 8,
      alpha: 1,
      color,
      speed: 380,
    });
  }

  /** Swirling soul orbs around the Knight while focusing */
  public emitSoulFocus(x: number, y: number) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 20;
    const life = 0.45;
    this.particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * 75,
      vy: -Math.sin(angle) * 75,
      color: '#e0f2fe',
      size: 3 + Math.random() * 3,
      alpha: 0.9,
      decay: 1 / life,
      life,
      maxLife: life,
      shape: 'soul',
    });
  }

  /** Burst of soul motes upon successfully healing */
  public emitHealBurst(x: number, y: number) {
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const speed = 100 + Math.random() * 150;
      const life = 0.6 + Math.random() * 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#38bdf8',
        size: 4 + Math.random() * 3,
        alpha: 1,
        decay: 1 / life,
        gravity: -60, // floats upward
        life,
        maxLife: life,
        shape: 'soul',
      });
    }
  }

  /** Boss or player ghosting trail / afterimage */
  public addAfterimage(
    x: number,
    y: number,
    facing: number,
    scaleX: number,
    scaleY: number,
    pose: 'dash' | 'dive',
    color: string = 'rgba(245, 158, 11, 0.4)',
    rotation: number = 0
  ) {
    this.afterimages.push({
      x,
      y,
      facing,
      scaleX,
      scaleY,
      alpha: 0.65,
      pose,
      color,
      decay: 3.2,
      rotation,
    });
  }

  /** Slash arc visual */
  public addSlash(x: number, y: number, direction: 'left' | 'right' | 'up' | 'down', size: number = 70) {
    this.slashes.push({
      x,
      y,
      direction,
      progress: 0,
      duration: 0.16,
      size,
    });
  }

  // --- UPDATE ---

  public update(dt: number) {
    // Update ambient dust
    for (const dust of this.ambientDust) {
      dust.y -= dust.speed * dt;
      dust.phase += dt * 1.5;
      dust.x += Math.sin(dust.phase) * 12 * dt;
      if (dust.y < -10) {
        dust.y = 730;
        dust.x = Math.random() * 1280;
      }
    }

    // Update regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }

      // Bounce on floor
      if (p.bounce && p.y >= FLOOR_Y) {
        p.y = FLOOR_Y;
        p.vy = -p.vy * 0.45;
        p.vx *= 0.75;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += s.speed * dt;
      s.alpha = Math.max(0, 1 - s.radius / s.maxRadius);
      if (s.radius >= s.maxRadius || s.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const a = this.afterimages[i];
      a.alpha -= a.decay * dt;
      if (a.alpha <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    // Update slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const sl = this.slashes[i];
      sl.progress += dt / sl.duration;
      if (sl.progress >= 1) {
        this.slashes.splice(i, 1);
      }
    }
  }

  // --- RENDER ---

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Ambient dust motes
    for (const dust of this.ambientDust) {
      ctx.fillStyle = `rgba(186, 230, 253, ${dust.alpha})`;
      ctx.beginPath();
      ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Ghost Afterimages (dash / dive silhouettes)
    for (const a of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.fillStyle = a.color;
      ctx.translate(a.x, a.y);
      ctx.scale(a.facing * a.scaleX, a.scaleY);
      if (a.rotation) ctx.rotate(a.rotation);

      if (a.pose === 'dive') {
        // Diving spear plunge silhouette
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(-14, -26);
        ctx.lineTo(0, -38);
        ctx.lineTo(14, -26);
        ctx.closePath();
        ctx.fill();
      } else {
        // Horizontal aerodynamic dash silhouette
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(-32, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Shockwaves (rendered as ground-flattened ellipses)
    for (const s of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.alpha * 0.85;
      ctx.lineWidth = s.width * s.alpha;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius * 1.4, s.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Regular particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      } else if (p.shape === 'soul') {
        // Glowing soul orb with cyan halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Nail slash effects
    for (const sl of this.slashes) {
      this.renderSlash(ctx, sl);
    }

    ctx.restore();
  }

  private renderSlash(ctx: CanvasRenderingContext2D, sl: SlashEffect) {
    ctx.save();
    ctx.translate(sl.x, sl.y);

    let baseAngle = 0;
    if (sl.direction === 'left') baseAngle = Math.PI;
    else if (sl.direction === 'up') baseAngle = -Math.PI / 2;
    else if (sl.direction === 'down') baseAngle = Math.PI / 2;

    ctx.rotate(baseAngle);

    const alpha = Math.sin((1 - sl.progress) * Math.PI);
    ctx.globalAlpha = alpha;

    const radius = sl.size;
    const arcSpan = Math.PI * 0.75;
    const startAngle = -arcSpan / 2;
    const endAngle = arcSpan / 2;

    // Glowing cyan/white nail arc
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.lineWidth = 14 * (1 - sl.progress * 0.5);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Secondary cyan energetic aura
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, startAngle + 0.1, endAngle - 0.1);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.stroke();

    ctx.restore();
  }
}
