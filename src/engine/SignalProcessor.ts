export type FrequencyBands = {
  bass: number;
  lowMid: number;
  mid: number;
  high: number;
};

export class SignalProcessor {
  private audio: HTMLAudioElement;
  public audioCtx: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode;
  private dataArray: Uint8Array;

  constructor(audio: HTMLAudioElement) {
    this.audio = audio;

    this.audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;

    this.source = this.audioCtx.createMediaElementSource(audio);

    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    console.log("SignalProcessor initialized");
  }

  resume() {
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    if (this.audio.paused) return;
  }

  getFrequencyBands(): FrequencyBands {
    (this.analyser as any).getByteFrequencyData(this.dataArray);

    return {
      bass: this.getAvg(0, 10),
      lowMid: this.getAvg(10, 30),
      mid: this.getAvg(30, 80),
      high: this.getAvg(80, 256),
    };
  }

  private getAvg(start: number, end: number) {
    let sum = 0;
    let count = 0;

    for (let i = start; i < end; i++) {
      sum += this.dataArray[i];
      count++;
    }

    return count ? sum / count : 0;
  }
}