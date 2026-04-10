import { ParticleSystem } from "./ParticleSystem";
import type {
  FrequencyBands,
  RenderParams,
  Shockwave,
  VisualMode,
} from "../types/visualization";

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
    const hue = (this.time * 40 + mid * 0.2) % 360;

    this.drawBackdrop(bands, params.mode, hue, isKick);
    this.drawShockwaves();
    this.particles.update(bands, { ...params, shockwaves: this.shockwaves }, this.time);
    this.particles.draw(this.ctx, bands, this.time);
  }

  private drawBackdrop(
    bands: FrequencyBands,
    mode: VisualMode,
    hue: number,
    isKick: boolean
  ) {
    switch (mode) {
      case "prism":
        this.drawPrismBackdrop(bands, hue, isKick);
        break;
      case "pulse":
        this.drawPulseBackdrop(bands, hue, isKick);
        break;
      case "nebula":
      default:
        this.drawNebulaBackdrop(bands, hue, isKick);
        break;
    }
  }

  private drawNebulaBackdrop(
    bands: FrequencyBands,
    hue: number,
    isKick: boolean
  ) {
    const { bass, mid } = bands;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius =
      this.width * (0.6 + Math.sin(this.time) * 0.05 + bass * 0.002);
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    gradient.addColorStop(0, `hsla(${hue}, 70%, ${20 + bass * 0.2}%, 0.25)`);
    gradient.addColorStop(1, `hsla(${hue + 60}, 60%, 5%, 0.4)`);
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
  }

  private drawPrismBackdrop(
    bands: FrequencyBands,
    hue: number,
    isKick: boolean
  ) {
    const { bass, high } = bands;
    this.ctx.fillStyle = `hsla(${(hue + 220) % 360}, 45%, 5%, 0.34)`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    const beamCount = 18;
    for (let i = 0; i < beamCount; i++) {
      const progress = i / beamCount;
      const angle = this.time * 0.8 + progress * Math.PI * 2;
      const beamHue = (hue + progress * 120 + high * 0.12) % 360;
      const beamLength = this.width * (0.24 + bass * 0.002 + progress * 0.12);

      this.ctx.strokeStyle = `hsla(${beamHue}, 95%, 70%, 0.2)`;
      this.ctx.lineWidth = 1.5 + progress * 4;
      this.ctx.beginPath();
      this.ctx.moveTo(this.width / 2, this.height / 2);
      this.ctx.lineTo(
        this.width / 2 + Math.cos(angle) * beamLength,
        this.height / 2 + Math.sin(angle) * beamLength
      );
      this.ctx.stroke();
    }

    this.ctx.restore();

    if (isKick) {
      this.ctx.fillStyle = "rgba(255,255,255,0.12)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private drawPulseBackdrop(
    bands: FrequencyBands,
    hue: number,
    isKick: boolean
  ) {
    const { bass, lowMid } = bands;
    this.ctx.fillStyle = `hsla(${(hue + 300) % 360}, 40%, 4%, 0.42)`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 6; i++) {
      const ringRadius =
        this.width * (0.08 + i * 0.08) + Math.sin(this.time * 2 + i) * 18 + bass;
      this.ctx.strokeStyle = `hsla(${(hue + i * 18) % 360}, 85%, 68%, ${0.08 + i * 0.03})`;
      this.ctx.lineWidth = 2 + lowMid * 0.01 + i * 0.6;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();

    if (isKick) {
      this.ctx.fillStyle = "rgba(255,255,255,0.16)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
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
