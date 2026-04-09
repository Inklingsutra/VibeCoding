export class AudioEngine {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode;
  private dataArray: Uint8Array;

  constructor(audioElement: HTMLAudioElement) {
    this.context = new AudioContext();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;

    this.source = this.context.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}