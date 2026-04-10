import type { FrequencyBands } from "../types/visualization";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class AudioEngine {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer>;

  constructor() {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error("Web Audio API is not supported in this browser.");
    }

    this.context = new AudioContextCtor();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.82;
    this.analyser.connect(this.context.destination);

    this.dataArray = new Uint8Array(
      new ArrayBuffer(this.analyser.frequencyBinCount)
    );
  }

  attachMediaElement(audioElement: HTMLAudioElement) {
    if (this.source) {
      return;
    }

    this.source = this.context.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
  }

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async suspend() {
    if (this.context.state === "running") {
      await this.context.suspend();
    }
  }

  getFrequencyBands(): FrequencyBands {
    this.analyser.getByteFrequencyData(this.dataArray);

    return {
      bass: this.getAverage(0, 10),
      lowMid: this.getAverage(10, 30),
      mid: this.getAverage(30, 80),
      high: this.getAverage(80, 256),
    };
  }

  private getAverage(start: number, end: number) {
    let sum = 0;
    let count = 0;

    for (let i = start; i < end; i++) {
      sum += this.dataArray[i];
      count += 1;
    }

    return count === 0 ? 0 : sum / count;
  }

  dispose() {
    this.source?.disconnect();
    this.analyser.disconnect();
    void this.context.close();
  }
}
