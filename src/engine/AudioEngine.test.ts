import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./AudioEngine";

class MockAnalyser {
  fftSize = 0;
  smoothingTimeConstant = 0;
  frequencyBinCount = 256;
  connect = vi.fn();
  disconnect = vi.fn();
  getByteFrequencyData = vi.fn((array: Uint8Array) => {
    array.fill(0);
    array.fill(10, 0, 3);
    array.fill(20, 3, 7);
    array.fill(30, 7, 47);
    array.fill(40, 47, 233);
  });
}

class MockSource {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockStreamSource extends MockSource {}

class MockAudioContext {
  state: AudioContextState = "suspended";
  sampleRate = 22050;
  destination = {};
  analyser = new MockAnalyser();
  source = new MockSource();
  streamSource = new MockStreamSource();
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
  createAnalyser = vi.fn(() => this.analyser as unknown as AnalyserNode);
  createMediaElementSource = vi.fn(
    () => this.source as unknown as MediaElementAudioSourceNode
  );
  createMediaStreamSource = vi.fn(
    () => this.streamSource as unknown as MediaStreamAudioSourceNode
  );
}

describe("AudioEngine", () => {
  beforeEach(() => {
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;
  });

  it("attaches media once and samples expected frequency bands", () => {
    const audio = document.createElement("audio");
    const engine = new AudioEngine();

    engine.attachMediaElement(audio);
    engine.attachMediaElement(audio);

    const bands = engine.getFrequencyBands();

    expect(bands.subKick).toBeCloseTo(10, 5);
    expect(bands.bass).toBeCloseTo(18, 5);
    expect(bands.mids).toBeCloseTo(29.8, 1);
    expect(bands.highs).toBeCloseTo(39.9, 1);
  });

  it("resumes, suspends, and disposes the audio context lifecycle", async () => {
    const audio = document.createElement("audio");
    const engine = new AudioEngine();

    engine.attachMediaElement(audio);

    await engine.resume();
    await engine.suspend();
    engine.dispose();

    const context = (engine as unknown as { context: MockAudioContext }).context;
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.suspend).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.analyser.disconnect).toHaveBeenCalledTimes(1);
    expect(context.source.disconnect).toHaveBeenCalledTimes(1);
  });

  it("falls back to captureStream when media element source creation is unavailable", () => {
    const audio = document.createElement("audio");
    const stream = {} as MediaStream;
    const engine = new AudioEngine();
    const context = (engine as unknown as { context: MockAudioContext }).context;

    context.createMediaElementSource.mockImplementation(() => {
      throw new DOMException("already connected", "InvalidStateError");
    });
    audio.captureStream = vi.fn(() => stream);

    engine.attachMediaElement(audio);

    expect(audio.captureStream).toHaveBeenCalledTimes(1);
    expect(context.createMediaStreamSource).toHaveBeenCalledWith(stream);
    expect(context.streamSource.connect).toHaveBeenCalledTimes(1);
  });
});
