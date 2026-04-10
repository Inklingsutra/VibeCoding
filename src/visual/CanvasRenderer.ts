import { ParticleSystem } from "./ParticleSystem";
import type { FrequencyBands, RenderParams, Shockwave } from "../types/visualization";

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width!: number;
  private height!: number;
  private particles: ParticleSystem;
  private time = 0;
  private lastBass = 0;
  private shockwaves: Shockwave[] = [];
  private canvas: HTMLCanvasElement;
  private handleResize: () => void;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("2D canvas context is not available.");
    }

    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;
    this.particles = new ParticleSystem(this.width, this.height, 1000);
    this.handleResize = () => {
      this.resize();
    };

    this.resize();
    window.addEventListener("resize", this.handleResize);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.particles.resize(this.width, this.height);
  }

  render(bands: FrequencyBands, params: RenderParams) {

    const isKick = bands.bass > this.lastBass * 1.4 && bands.bass > 120;

    if (isKick) {
      this.shockwaves.push({
        radius: 0,
        strength: bands.bass,
      });
    }

    this.lastBass = bands.bass;
    const { bass, mid } = bands;
    this.time += 0.02 + bass * 0.001;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius =
      this.width * (0.6 + Math.sin(this.time) * 0.05 + bass * 0.002);
    const gradient = this.ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      radius
    );
    const hue = (this.time * 40 + mid * 0.2) % 360;
    gradient.addColorStop(
      0,
      `hsla(${hue}, 70%, ${20 + bass * 0.2}%, 0.25)`
    );
    gradient.addColorStop(
      1,
      `hsla(${hue + 60}, 60%, 5%, 0.4)`
    );
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (isKick) {
      this.ctx.fillStyle = "rgba(255,255,255,0.08)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    this.ctx.save();
    this.ctx.globalAlpha = 0.08;

    for (let i = 0; i < 80; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const angle =
        Math.sin(x * 0.002 + this.time) +
        Math.cos(y * 0.002 + this.time);
      const length = 20 + mid * 0.5;
      this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.3)`;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
      this.ctx.stroke();
    }

    this.ctx.restore();
    this.drawShockwaves();
    this.particles.update(bands, { ...params, shockwaves: this.shockwaves }, this.time);
    this.particles.draw(this.ctx, bands, this.time);
  }

  private drawShockwaves() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";

    for (const shockwave of this.shockwaves) {
      shockwave.radius += 30 + shockwave.strength * 0.2;

      const alpha = Math.max(0, 1 - shockwave.radius / this.width);
      this.ctx.strokeStyle = `hsla(${this.time * 40}, 100%, 70%, ${alpha})`;
      this.ctx.lineWidth = 3 + shockwave.strength * 0.02;
      this.ctx.beginPath();
      this.ctx.arc(
        this.width / 2,
        this.height / 2,
        shockwave.radius,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    }

    this.shockwaves = this.shockwaves.filter(
      (shockwave) => shockwave.radius < this.width
    );

    this.ctx.restore();
  }

  dispose() {
    window.removeEventListener("resize", this.handleResize);
  }
}
