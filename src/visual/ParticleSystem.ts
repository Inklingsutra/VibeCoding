import type { FrequencyBands, RenderParams } from "../types/visualization";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export class ParticleSystem {
  private particles: Particle[] = [];
  private width: number;
  private height: number;

  constructor(width: number, height: number, count: number) {
    this.width = width;
    this.height = height;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
    };
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  update(bands: FrequencyBands, params: RenderParams, time: number) {
  const { bass, mid } = bands;

  const centerX = this.width / 2;
  const centerY = this.height / 2;

  for (const p of this.particles) {
    const dx = p.x - centerX;
    const dy = p.y - centerY;

    const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

    const angle =
      Math.atan2(dy, dx) +
      Math.sin(dist * 0.01 + time) * 0.6;

    const speed =
      0.2 +
      bass * 0.008 +
      mid * 0.004 +
      params.flow * 1.5;

    const attract = 0.0015 + bass * 0.0004;

    p.vx +=
      Math.cos(angle) * speed +
      dx * attract;

    p.vy +=
      Math.sin(angle) * speed +
      dy * attract;

    const maxSpeed = 2.5;
    const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

    if (v > maxSpeed) {
      p.vx = (p.vx / v) * maxSpeed;
      p.vy = (p.vy / v) * maxSpeed;
    }

    const shockwaves = params.shockwaves ?? [];

    for (const sw of shockwaves) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

      const diff = Math.abs(dist - sw.radius);

      if (diff < 60) {
        const falloff = 1 - diff / 60;

        const force = falloff * (12 + sw.strength * 0.04);
        const twist = 0.3;

        p.vx += (dx / dist) * force + Math.cos(dist * 0.05) * twist;
        p.vy += (dy / dist) * force + Math.sin(dist * 0.05) * twist;
      }
    }

    p.vx *= 0.96;
    p.vy *= 0.96;

    p.x += p.vx;
    p.y += p.vy;

    if (dist < 50) {
      p.vx += dx * 0.002;
      p.vy += dy * 0.002;
    }

    const margin = 10;

    if (
      p.x < -margin ||
      p.x > this.width + margin ||
      p.y < -margin ||
      p.y > this.height + margin
    ) {
      p.x = centerX + (Math.random() - 0.5) * 200;
      p.y = centerY + (Math.random() - 0.5) * 200;
      p.vx = 0;
      p.vy = 0;
    }
  }
}

  draw(ctx: CanvasRenderingContext2D, bands: FrequencyBands, time: number) {
    const { high } = bands;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const p of this.particles) {
      const hue = (time * 50 + p.x * 0.05) % 360;
      const brightness = 60 + high * 0.5 + (bands.bass > 120 ? 20 : 0);

      ctx.fillStyle = `hsl(${hue}, 80%, ${brightness}%)`;
      ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }

    ctx.restore();
  }
}
