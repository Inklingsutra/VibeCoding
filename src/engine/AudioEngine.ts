import type { FrequencyBands } from "../types/visualization";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }

  interface HTMLMediaElement {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  }
}

export class AudioEngine {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private source: AudioNode | null = null;
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

    try {
      this.source = this.context.createMediaElementSource(audioElement);
    } catch (error) {
      const captureStream =
        audioElement.captureStream?.bind(audioElement) ??
        audioElement.mozCaptureStream?.bind(audioElement);

      if (
        error instanceof DOMException &&
        error.name === "InvalidStateError" &&
        captureStream
      ) {
        const stream = captureStream();
        this.source = this.context.createMediaStreamSource(stream);
      } else {
        throw error;
      }
    }

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
    const binWidth = this.context.sampleRate / this.analyser.fftSize;

    return {
      subKick: this.getAverageForRange(20, 120, binWidth),
      bass: this.getAverageForRange(120, 300, binWidth),
      mids: this.getAverageForRange(300, 2000, binWidth),
      highs: this.getAverageForRange(2000, 10000, binWidth),
    };
  }

  private getAverageForRange(startHz: number, endHz: number, binWidth: number) {
    const start = Math.max(0, Math.floor(startHz / binWidth));
    const end = Math.min(
      this.dataArray.length,
      Math.max(start + 1, Math.ceil(endHz / binWidth))
    );

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
