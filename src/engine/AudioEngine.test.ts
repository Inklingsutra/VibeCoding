import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./AudioEngine";

class MockAnalyser {
  fftSize = 0;
  smoothingTimeConstant = 0;
  frequencyBinCount = 256;
  connect = vi.fn();
  disconnect = vi.fn();
  getByteFrequencyData = vi.fn((array: Uint8Array) => {
    array.fill(10, 0, 10);
    array.fill(20, 10, 30);
    array.fill(30, 30, 80);
    array.fill(40, 80, 256);
  });
}

class MockSource {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioContext {
  state: AudioContextState = "suspended";
  destination = {};
  analyser = new MockAnalyser();
  source = new MockSource();
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

    expect(bands).toEqual({
      bass: 10,
      lowMid: 20,
      mid: 30,
      high: 40,
    });
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
});
