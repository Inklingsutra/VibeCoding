import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const renderSpy = vi.fn();
const disposeRendererSpy = vi.fn();
const attachMediaElementSpy = vi.fn();
const resumeSpy = vi.fn(async () => {});
const suspendSpy = vi.fn(async () => {});
const getFrequencyBandsSpy = vi.fn(() => ({
  bass: 120,
  lowMid: 80,
  mid: 60,
  high: 40,
}));
const disposeEngineSpy = vi.fn();

vi.mock("./engine/AudioEngine", () => ({
  AudioEngine: class MockAudioEngine {
    attachMediaElement = attachMediaElementSpy;
    resume = resumeSpy;
    suspend = suspendSpy;
    getFrequencyBands = getFrequencyBandsSpy;
    dispose = disposeEngineSpy;
  },
}));

vi.mock("./visual/CanvasRenderer", () => ({
  CanvasRenderer: class MockCanvasRenderer {
    render = renderSpy;
    dispose = disposeRendererSpy;
  },
}));

describe("App", () => {
  let requestAnimationFrameCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    renderSpy.mockClear();
    disposeRendererSpy.mockClear();
    attachMediaElementSpy.mockClear();
    resumeSpy.mockClear();
    suspendSpy.mockClear();
    getFrequencyBandsSpy.mockClear();
    disposeEngineSpy.mockClear();
    requestAnimationFrameCallback = null;

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        requestAnimationFrameCallback = callback;
        return 1;
      })
    );

    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:custom-track"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("uploads audio, switches mode, and renders with the selected params", async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(["audio"], "custom-track.mp3", { type: "audio/mpeg" });
    await user.upload(screen.getByLabelText(/upload audio/i), file);
    await user.selectOptions(screen.getByRole("combobox"), "prism");

    expect(screen.getByText("custom-track.mp3")).toBeInTheDocument();

    const media = document.querySelector("audio") as HTMLAudioElement;
    Object.defineProperty(media, "paused", {
      configurable: true,
      get: () => false,
    });
    Object.defineProperty(media, "ended", {
      configurable: true,
      get: () => false,
    });

    fireEvent.play(media);

    await waitFor(() => {
      expect(attachMediaElementSpy).toHaveBeenCalledWith(media);
      expect(resumeSpy).toHaveBeenCalledTimes(1);
    });

    requestAnimationFrameCallback?.(16.6);

    await waitFor(() => {
      expect(renderSpy).toHaveBeenCalled();
    });

    const [, params] = renderSpy.mock.calls.at(-1) as [unknown, { mode: string }];
    expect(params.mode).toBe("prism");
    expect(media.src).toContain("blob:custom-track");
  });

  it("returns to the bundled sample source", async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(["audio"], "custom-track.mp3", { type: "audio/mpeg" });
    await user.upload(screen.getByLabelText(/upload audio/i), file);
    await user.click(screen.getByRole("button", { name: /use sample/i }));

    expect(screen.getByText("Bundled sample")).toBeInTheDocument();
    expect((document.querySelector("audio") as HTMLAudioElement).src).toContain(
      "/sample.wav"
    );
  });
});
