import type { FrequencyBands, RenderParams } from "../types/visualization";

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  depth: number;
};

export class ParticleSystem {
  private particles: Particle[] = [];
  private width: number;
  private height: number;
  private activeCount: number;

  constructor(width: number, height: number, count: number) {
    this.width = width;
    this.height = height;
    this.activeCount = count;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;

    return {
      x,
      y,
      px: x,
      py: y,
      vx: 0,
      vy: 0,
      depth: Math.random(),
    };
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private getActiveParticles(particleScale: number) {
    const targetCount = Math.round(this.particles.length * particleScale);
    this.activeCount = Math.max(
      120,
      Math.min(this.particles.length, targetCount)
    );

    return this.particles.slice(0, this.activeCount);
  }

  update(bands: FrequencyBands, params: RenderParams, time: number) {
    const activeParticles = this.getActiveParticles(params.particles);
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const direction = Math.sin(time * 0.7 + bands.bass * 0.01) * Math.PI;

    for (const p of activeParticles) {
      p.px = p.x;
      p.py = p.y;

      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

      const modeWave =
        params.mode === "prism" ? 0.3 : params.mode === "pulse" ? 0.9 : 0.6;
      const angle =
        Math.atan2(dy, dx) +
        direction * 0.28 +
        Math.sin(dist * 0.01 + time + p.depth * 6) *
          (modeWave + bands.mids * 0.0008);

      const speed =
        0.15 +
        bands.subKick * 0.006 +
        bands.bass * 0.012 +
        bands.mids * 0.008 +
        params.flow *
          (params.mode === "pulse" ? 3.4 : params.mode === "prism" ? 2.7 : 2.2) *
          (0.55 + p.depth);

      const attractBase = params.mode === "prism" ? 0.0008 : 0.0015;
      const attract =
        attractBase +
        bands.subKick * 0.00025 +
        bands.bass * 0.0004 +
        params.flow * 0.0004;
      const swirl =
        Math.sin(time * 1.8 + p.depth * 10 + dist * 0.018) *
        (0.2 + bands.mids * 0.0012);

      p.vx +=
        Math.cos(angle) * speed +
        dx * attract * (0.9 - p.depth * 0.25) +
        Math.cos(direction + p.depth * Math.PI * 2) * swirl;
      p.vy +=
        Math.sin(angle) * speed +
        dy * attract * (0.9 - p.depth * 0.25) +
        Math.sin(direction + p.depth * Math.PI * 2) * swirl;

      const maxSpeed =
        params.mode === "pulse" ? 5.6 : params.mode === "prism" ? 4.1 : 4.6;
      const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

      if (velocity > maxSpeed) {
        p.vx = (p.vx / velocity) * maxSpeed;
        p.vy = (p.vy / velocity) * maxSpeed;
      }

      const shockwaves = params.shockwaves ?? [];
      for (const shockwave of shockwaves) {
        const waveDx = p.x - centerX;
        const waveDy = p.y - centerY;
        const waveDist = Math.sqrt(waveDx * waveDx + waveDy * waveDy) + 0.0001;
        const diff = Math.abs(waveDist - shockwave.radius);

        if (diff < 60) {
          const falloff = 1 - diff / 60;
          const force = falloff * (12 + shockwave.strength * 0.04);
          const twist =
            params.mode === "prism" ? 0.08 : params.mode === "pulse" ? 0.5 : 0.3;

          p.vx +=
            (waveDx / waveDist) * force + Math.cos(waveDist * 0.05) * twist;
          p.vy +=
            (waveDy / waveDist) * force + Math.sin(waveDist * 0.05) * twist;
        }
      }

      const damping =
        params.mode === "prism" ? 0.9 : params.mode === "pulse" ? 0.92 : 0.94;
      p.vx *= damping;
      p.vy *= damping;

      p.x += p.vx;
      p.y += p.vy;

      if (dist < 50) {
        p.vx += dx * 0.0025;
        p.vy += dy * 0.0025;
      }

      if (
        p.x < -10 ||
        p.x > this.width + 10 ||
        p.y < -10 ||
        p.y > this.height + 10
      ) {
        const spread =
          (params.mode === "prism" ? 320 : 200) *
          (0.8 + params.particles * 0.45);
        p.x = centerX + (Math.random() - 0.5) * spread;
        p.y = centerY + (Math.random() - 0.5) * spread;
        p.px = p.x;
        p.py = p.y;
        p.vx = 0;
        p.vy = 0;
        p.depth = Math.random();
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    bands: FrequencyBands,
    params: RenderParams,
    time: number
  ) {
    const activeParticles = this.getActiveParticles(params.particles);
    const size =
      params.mode === "pulse"
        ? 1.2 + params.particles * 1.3
        : params.mode === "prism"
          ? 1 + params.particles * 0.8
          : 1.1 + params.particles;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const shimmer = 0.3 + (bands.highs / 255) * 0.9;
    const trailAlpha = 0.04 + (bands.subKick / 255) * 0.08;

    for (const p of activeParticles) {
      const hue = (time * 60 + p.x * 0.05 + p.depth * 120) % 360;
      const brightness =
        58 + bands.highs * 0.35 + (bands.subKick > 120 ? 18 : 0);
      const depthScale = 0.45 + p.depth * 1.8;
      const particleSize = size * depthScale;

      ctx.strokeStyle = `hsla(${hue}, 100%, ${brightness}%, ${trailAlpha})`;
      ctx.lineWidth = Math.max(0.6, particleSize * 0.55);
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      ctx.fillStyle = `hsla(${hue + shimmer * 20}, 95%, ${brightness}%, ${
        0.3 + p.depth * 0.45
      })`;
      ctx.fillRect(
        p.x - particleSize * 0.5,
        p.y - particleSize * 0.5,
        particleSize,
        particleSize
      );

      if (p.depth > 0.74 || bands.highs > 150) {
        const sparkleSize = particleSize * (1.2 + bands.highs * 0.0025);
        ctx.fillStyle = `hsla(${hue + 40}, 100%, 78%, ${
          0.08 + bands.highs * 0.0012
        })`;
        ctx.fillRect(
          p.x - sparkleSize * 0.25,
          p.y - sparkleSize * 0.25,
          sparkleSize * 0.5,
          sparkleSize * 0.5
        );
      }
    }

    ctx.restore();
  }
}
