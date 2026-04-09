type Bands = {
  bass: number;
  lowMid: number;
  mid: number;
  high: number;
};

type Params = {
  sensitivity: number;
  flow: number;
  particles: number;
};

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

  update(bands: Bands, params: Params, time: number) {
  const { bass, mid } = bands;

  const centerX = this.width / 2;
  const centerY = this.height / 2;

  for (let p of this.particles) {
    const dx = p.x - centerX;
    const dy = p.y - centerY;

    const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

    // 🌀 spiral field
    const angle =
      Math.atan2(dy, dx) +
      Math.sin(dist * 0.01 + time) * 0.6;

    // ⚡ energy
    const speed =
      0.2 +
      bass * 0.008 +
      mid * 0.004 +
      params.flow * 1.5;

    // 🧲 STRONGER CENTER ATTRACTOR
    const attract = 0.0015 + bass * 0.0004;

    p.vx +=
      Math.cos(angle) * speed +
      dx * attract;

    p.vy +=
      Math.sin(angle) * speed +
      dy * attract;

    // 🧯 VELOCITY CLAMP (CRITICAL)
    const maxSpeed = 2.5;
    const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

    if (v > maxSpeed) {
      p.vx = (p.vx / v) * maxSpeed;
      p.vy = (p.vy / v) * maxSpeed;
    }

    // ⚡ ULTRA IMPACT SHOCKWAVE
    const shockwaves = (params as any).shockwaves || [];

    for (let sw of shockwaves) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;

      const diff = Math.abs(dist - sw.radius);

      if (diff < 60) {
        const falloff = 1 - diff / 60;

        // 💥 STRONG radial push
        const force = falloff * (12 + sw.strength * 0.04);

        // 💫 swirl twist (important for fractal feel)
        const twist = 0.3;

        p.vx += (dx / dist) * force + Math.cos(dist * 0.05) * twist;
        p.vy += (dy / dist) * force + Math.sin(dist * 0.05) * twist;
      }
    }

    /* ⚡ shockwave influence
    for (let sw of (params as any).shockwaves || []) {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const diff = Math.abs(dist - sw.radius);

      if (diff < 20) {
        //const force = (1 - diff / 20) * 2;
        const force = (1 - diff / 20) * (6 + sw.strength * 0.02);

        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }*/

    // damping
    p.vx *= 0.96;
    p.vy *= 0.96;

    p.x += p.vx;
    p.y += p.vy;

    if (dist < 50) {
      p.vx += dx * 0.002;
      p.vy += dy * 0.002;
    }

    // 🌌 SOFT CONTAINMENT (NOT WRAP)
    const margin = 10;

    if (
      p.x < -margin ||
      p.x > this.width + margin ||
      p.y < -margin ||
      p.y > this.height + margin
    ) {
      // respawn near center
      p.x = centerX + (Math.random() - 0.5) * 200;
      p.y = centerY + (Math.random() - 0.5) * 200;
      p.vx = 0;
      p.vy = 0;
    }
  }
}

  draw(ctx: CanvasRenderingContext2D, bands: Bands, time: number) {
    const { high } = bands;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let p of this.particles) {
      const hue = (time * 50 + p.x * 0.05) % 360;
      const brightness = 60 + high * 0.5 + (bands.bass > 120 ? 20 : 0);

      ctx.fillStyle = `hsl(${hue}, 80%, ${brightness}%)`;
      ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }

    ctx.restore();
  }
}