import { ParticleSystem } from "./ParticleSystem";
import type {
  FrequencyBands,
  RenderParams,
  Shockwave,
} from "../types/visualization";

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width!: number;
  private height!: number;
  private particles: ParticleSystem;
  private time = 0;
  private lastSubKick = 0;
  private flowPhase = 0;
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
    const isKick =
      bands.subKick > this.lastSubKick * 1.28 && bands.subKick > 110;

    if (isKick) {
      this.shockwaves.push({
        radius: 0,
        strength: bands.subKick,
      });
    }

    this.lastSubKick = bands.subKick;
    this.time += 0.01 + params.flow * 0.03 + bands.subKick * 0.0014;
    this.flowPhase += 0.005 + bands.bass * 0.00035 + params.flow * 0.015;

    const hue =
      (this.time * 55 + bands.mids * 0.18 + bands.highs * 0.08) % 360;

    this.drawBackdrop(bands, params, hue, isKick);
    this.drawShockwaves(params.flow);
    this.particles.update(
      bands,
      { ...params, shockwaves: this.shockwaves },
      this.time
    );
    this.particles.draw(this.ctx, bands, params, this.time);
  }

  private drawBackdrop(
    bands: FrequencyBands,
    params: RenderParams,
    hue: number,
    isKick: boolean
  ) {
    switch (params.mode) {
      case "prism":
        this.drawPrismBackdrop(bands, params, hue, isKick);
        break;
      case "pulse":
        this.drawPulseBackdrop(bands, params, hue, isKick);
        break;
      case "nebula":
      default:
        this.drawNebulaBackdrop(bands, params, hue, isKick);
        break;
    }
  }

  private drawNebulaBackdrop(
    bands: FrequencyBands,
    params: RenderParams,
    hue: number,
    isKick: boolean
  ) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius =
      this.width *
      (0.44 + Math.sin(this.time * 0.6) * 0.04 + bands.subKick * 0.0028);
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    this.ctx.fillStyle = `hsla(${(hue + 220) % 360}, 40%, 3%, 0.2)`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    gradient.addColorStop(
      0,
      `hsla(${hue}, 95%, ${28 + bands.subKick * 0.15}%, 0.18)`
    );
    gradient.addColorStop(
      0.45,
      `hsla(${hue + 70}, 88%, ${18 + bands.mids * 0.06}%, 0.11)`
    );
    gradient.addColorStop(1, `hsla(${hue + 160}, 65%, 4%, 0.1)`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawGlowField(hue, bands.subKick, bands.highs);
    this.drawBreathingNoise(hue, bands.highs);
    this.drawFractalMesh(hue, bands.mids, bands.bass, params.flow);

    if (isKick) {
      this.ctx.fillStyle = "rgba(255,255,255,0.12)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    this.ctx.save();
    this.ctx.globalAlpha = 0.04 + params.flow * 0.04;

    const streakCount = Math.round(35 + params.flow * 55);
    const flowDirection =
      Math.sin(this.flowPhase) * (0.8 + bands.bass * 0.0032);

    for (let i = 0; i < streakCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const angle =
        flowDirection +
        Math.sin(x * 0.003 + this.time * (1 + params.flow * 0.35)) +
        Math.cos(
          y * 0.0024 + this.time * (0.7 + bands.bass * 0.0012)
        );
      const length =
        8 + params.flow * 22 + bands.bass * 0.08 + bands.mids * 0.035;

      this.ctx.strokeStyle = `hsla(${
        hue + Math.sin(i + this.time) * 30
      }, 90%, 68%, 0.24)`;
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
    params: RenderParams,
    hue: number,
    isKick: boolean
  ) {
    this.ctx.fillStyle = `hsla(${(hue + 220) % 360}, 45%, 5%, 0.34)`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawGlowField(hue + 30, bands.subKick, bands.highs);
    this.drawFractalMesh(hue + 40, bands.mids, bands.bass, params.flow);

    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    const beamCount = Math.round(10 + params.flow * 12);
    for (let i = 0; i < beamCount; i++) {
      const progress = i / beamCount;
      const angle =
        this.time * (0.5 + params.flow * 0.9) + progress * Math.PI * 2;
      const beamHue = (hue + progress * 120 + bands.highs * 0.12) % 360;
      const beamLength =
        this.width *
        (0.18 + params.flow * 0.14 + bands.bass * 0.002 + progress * 0.12);

      this.ctx.strokeStyle = `hsla(${beamHue}, 95%, 70%, 0.2)`;
      this.ctx.lineWidth = 1 + progress * (2.5 + params.flow * 2.5);
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
    params: RenderParams,
    hue: number,
    isKick: boolean
  ) {
    this.ctx.fillStyle = `hsla(${(hue + 300) % 360}, 40%, 4%, 0.42)`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawGlowField(hue + 80, bands.subKick, bands.highs);
    this.drawBreathingNoise(hue + 30, bands.highs);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";

    const ringCount = Math.round(4 + params.flow * 4);
    for (let i = 0; i < ringCount; i++) {
      const ringRadius =
        this.width * (0.07 + i * 0.07) +
        Math.sin(this.time * (1.2 + params.flow) + i) *
          (10 + params.flow * 14) +
        bands.subKick;

      this.ctx.strokeStyle = `hsla(${
        (hue + i * 18) % 360
      }, 85%, 68%, ${0.08 + i * 0.03})`;
      this.ctx.lineWidth =
        1.2 + bands.mids * 0.006 + i * (0.4 + params.flow * 0.35);
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

  private drawGlowField(hue: number, subKick: number, highs: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 8; i++) {
      const px =
        this.width *
        (0.2 +
          ((i * 0.11 + Math.sin(this.time * 0.2 + i) * 0.08 + 1) % 0.7));
      const py =
        this.height *
        (0.18 +
          ((i * 0.13 + Math.cos(this.time * 0.16 + i) * 0.08 + 1) % 0.64));
      const radius = 60 + subKick * 0.8 + highs * 0.2 + i * 18;
      const glow = this.ctx.createRadialGradient(px, py, 0, px, py, radius);

      glow.addColorStop(
        0,
        `hsla(${(hue + i * 18) % 360}, 100%, 65%, 0.08)`
      );
      glow.addColorStop(
        0.35,
        `hsla(${(hue + 80 + i * 10) % 360}, 90%, 58%, 0.04)`
      );
      glow.addColorStop(1, "rgba(0,0,0,0)");

      this.ctx.fillStyle = glow;
      this.ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }

    this.ctx.restore();
  }

  private drawBreathingNoise(hue: number, highs: number) {
    const noiseCount = Math.round(20 + highs * 0.12);
    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < noiseCount; i++) {
      const x =
        (Math.sin(this.time * 0.7 + i * 13.7) * 0.5 + 0.5) * this.width;
      const y =
        (Math.cos(this.time * 0.55 + i * 7.9) * 0.5 + 0.5) * this.height;
      const size = 1 + (highs / 255) * 3;

      this.ctx.fillStyle = `hsla(${(hue + i * 9) % 360}, 100%, 72%, 0.08)`;
      this.ctx.fillRect(x, y, size, size);
    }

    this.ctx.restore();
  }

  private drawFractalMesh(
    hue: number,
    mids: number,
    bass: number,
    flow: number
  ) {
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";

    for (let layer = 0; layer < 5; layer++) {
      const radiusBase = this.width * (0.08 + layer * 0.055);
      const points = 26 + layer * 6;
      this.ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const t = (i / points) * Math.PI * 2;
        const deform =
          Math.sin(
            t * (2 + flow) + this.time * (1.2 + flow * 0.8) + layer
          ) *
            (10 + mids * 0.06) +
          Math.cos(t * (4 + bass * 0.004) - this.time * 0.8) *
            (6 + mids * 0.04);
        const depth = Math.sin(this.time + layer * 0.7) * (8 + bass * 0.02);
        const radius = radiusBase + deform + depth;
        const x = cx + Math.cos(t) * radius;
        const y = cy + Math.sin(t) * radius * (0.68 + layer * 0.04);

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      this.ctx.strokeStyle = `hsla(${
        (hue + layer * 24) % 360
      }, 90%, 68%, ${0.07 + layer * 0.025})`;
      this.ctx.lineWidth = 1 + layer * 0.6;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawShockwaves(flow: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "lighter";

    for (const shockwave of this.shockwaves) {
      shockwave.radius += 18 + flow * 20 + shockwave.strength * 0.18;

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
