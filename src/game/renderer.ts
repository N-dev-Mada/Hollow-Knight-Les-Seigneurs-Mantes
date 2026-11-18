/**
 * Arena environment renderer for the Mantis Village throne chamber.
 * Features carved stone thrones, iron braziers with animated cyan soul fire,
 * locking spiked arena gates, gothic pillars, and cavern mist.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_Y, ARENA_LEFT, ARENA_RIGHT } from './types';

export class ArenaRenderer {
  private flamePhase: number = 0;

  public update(dt: number) {
    this.flamePhase += dt * 8;
  }

  public render(ctx: CanvasRenderingContext2D, gatesLocked: boolean = true) {
    // 1. Deep Cavern Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(0.4, '#090e1d');
    bgGrad.addColorStop(0.85, '#0d1527');
    bgGrad.addColorStop(1, '#080c18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Distant Gothic Cavern Arches & Reliefs
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 3;

    // Background gothic arch ribs
    for (let x = 160; x <= CANVAS_WIDTH - 160; x += 240) {
      ctx.beginPath();
      ctx.moveTo(x - 80, 500);
      ctx.bezierCurveTo(x - 80, 180, x - 20, 80, x, 70);
      ctx.bezierCurveTo(x + 20, 80, x + 80, 180, x + 80, 500);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Massive Stone Thrones on High Pedestals
    this.renderThrone(ctx, CANVAS_WIDTH / 2, 190, 75, 120, true); // Center Lord's Throne
    this.renderThrone(ctx, CANVAS_WIDTH / 2 - 280, 195, 65, 110, false); // Left Sister Throne
    this.renderThrone(ctx, CANVAS_WIDTH / 2 + 280, 195, 65, 110, false); // Right Sister Throne

    // 4. Pillars with Burning Iron Braziers
    this.renderBrazierPillar(ctx, ARENA_LEFT + 100, 360);
    this.renderBrazierPillar(ctx, ARENA_RIGHT - 100, 360);

    // 5. Heavy Locked Spiked Arena Gates
    this.renderArenaGate(ctx, ARENA_LEFT - 40, gatesLocked);
    this.renderArenaGate(ctx, ARENA_RIGHT + 40, gatesLocked);

    // 6. Arena Stone Floor & Sub-Structure
    this.renderFloor(ctx);

    // 7. Cavern Ambient Light / Vignette
    const vignette = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      FLOOR_Y - 120,
      250,
      CANVAS_WIDTH / 2,
      FLOOR_Y - 120,
      750
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.7, 'rgba(4, 7, 17, 0.25)');
    vignette.addColorStop(1, 'rgba(2, 4, 10, 0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private renderThrone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isCenter: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Tall Stone Pedestal / Base
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-width * 0.7, 30);
    ctx.lineTo(-width * 0.5, -height * 0.2);
    ctx.lineTo(width * 0.5, -height * 0.2);
    ctx.lineTo(width * 0.7, 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spiked Gothic Throne Backrest
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-width * 0.5, -height * 0.2);
    ctx.lineTo(-width * 0.55, -height);
    // Spire crest top
    ctx.lineTo(-width * 0.2, -height * 1.15);
    ctx.lineTo(0, -height * 1.3);
    ctx.lineTo(width * 0.2, -height * 1.15);
    ctx.lineTo(width * 0.55, -height);
    ctx.lineTo(width * 0.5, -height * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Royal Crimson Cushion / Velvet Backing
    ctx.fillStyle = isCenter ? '#7f1d1d' : '#450a0a';
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.65, width * 0.35, height * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Carved insectoid sigil in the stone crest
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -height * 0.95, width * 0.18, 0, Math.PI * 2);
    ctx.moveTo(0, -height * 1.1);
    ctx.lineTo(0, -height * 0.8);
    ctx.stroke();

    ctx.restore();
  }

  private renderBrazierPillar(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    // Stone Column
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    ctx.fillRect(-18, 0, 36, FLOOR_Y - y);
    ctx.strokeRect(-18, 0, 36, FLOOR_Y - y);

    // Decorative bandings
    ctx.fillStyle = '#334155';
    ctx.fillRect(-22, 40, 44, 10);
    ctx.fillRect(-22, 120, 44, 10);

    // Iron Bowl / Brazier
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.quadraticCurveTo(-38, -25, -28, -35);
    ctx.lineTo(28, -35);
    ctx.quadraticCurveTo(38, -25, 32, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Animated Cyan Soul Fire
    const f1 = Math.sin(this.flamePhase) * 4;
    const f2 = Math.cos(this.flamePhase * 1.4) * 5;
    const f3 = Math.sin(this.flamePhase * 2.1) * 3;

    // Outer glow
    const glowGrad = ctx.createRadialGradient(0, -55, 5, 0, -55, 65);
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
    glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.2)');
    glowGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, -55, 65, 0, Math.PI * 2);
    ctx.fill();

    // Inner Fire Shape
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-22, -35);
    ctx.quadraticCurveTo(-14 + f1, -65, -8 + f2, -85);
    ctx.quadraticCurveTo(0 + f3, -65, 8 + f1, -85);
    ctx.quadraticCurveTo(14 + f2, -65, 22, -35);
    ctx.closePath();
    ctx.fill();

    // White-hot core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-10, -35);
    ctx.quadraticCurveTo(-4, -55, 0, -68 + f1);
    ctx.quadraticCurveTo(4, -55, 10, -35);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderArenaGate(ctx: CanvasRenderingContext2D, x: number, locked: boolean) {
    ctx.save();
    ctx.translate(x, 0);

    const gateY = locked ? 0 : -350; // Retracts upwards when unlocked

    // Heavy iron spiked gate
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;

    // Vertical Iron Spikes
    for (let offset = -25; offset <= 25; offset += 12) {
      ctx.beginPath();
      ctx.moveTo(offset, gateY);
      ctx.lineTo(offset, gateY + FLOOR_Y - 20);
      // Spike tip
      ctx.lineTo(offset + 3, gateY + FLOOR_Y);
      ctx.lineTo(offset + 6, gateY + FLOOR_Y - 20);
      ctx.lineTo(offset + 6, gateY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Horizontal crossbars
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-35, gateY + 150, 70, 18);
    ctx.strokeRect(-35, gateY + 150, 70, 18);
    ctx.fillRect(-35, gateY + 380, 70, 18);
    ctx.strokeRect(-35, gateY + 380, 70, 18);

    ctx.restore();
  }

  private renderFloor(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Base floor slab
    const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, CANVAS_HEIGHT);
    floorGrad.addColorStop(0, '#151d30');
    floorGrad.addColorStop(0.2, '#0f172a');
    floorGrad.addColorStop(1, '#050811');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);

    // Floor top edge highlight
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(CANVAS_WIDTH, FLOOR_Y);
    ctx.stroke();

    // Flagstone tiling & carved engravings
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    for (let x = 0; x < CANVAS_WIDTH; x += 110) {
      // Vertical stone joint
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x, FLOOR_Y + 45);
      ctx.stroke();

      // Stone slab bevel
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(x + 2, FLOOR_Y + 2, 106, 12);
    }

    // Secondary lower bedrock
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y + 45);
    ctx.lineTo(CANVAS_WIDTH, FLOOR_Y + 45);
    ctx.stroke();

    ctx.restore();
  }
}
