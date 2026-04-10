import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ControlPanel } from "./ControlPanel";
import type { VisualParams } from "../types/visualization";

const baseParams: VisualParams = {
  sensitivity: 1,
  flow: 1,
  particles: 1,
  mode: "nebula",
};

describe("ControlPanel", () => {
  it("supports audio upload, sample reset, and mode selection", async () => {
    const user = userEvent.setup();
    const setParams = vi.fn();
    const onFileSelect = vi.fn();
    const onUseSample = vi.fn();

    render(
      <ControlPanel
        params={baseParams}
        setParams={setParams}
        audioRef={{ current: null }}
        audioSrc="/sample.wav"
        sourceLabel="Bundled sample"
        onFileSelect={onFileSelect}
        onUseSample={onUseSample}
        visible
        toggle={vi.fn()}
      />
    );

    const file = new File(["audio"], "track.mp3", { type: "audio/mpeg" });
    await user.upload(screen.getByLabelText(/upload audio/i), file);
    await user.selectOptions(screen.getByRole("combobox"), "pulse");
    await user.click(screen.getByRole("button", { name: /use sample/i }));

    expect(onFileSelect).toHaveBeenCalledWith(file);
    expect(onUseSample).toHaveBeenCalledTimes(1);

    const modeUpdater = setParams.mock.calls[0][0] as (
      current: VisualParams
    ) => VisualParams;
    expect(modeUpdater(baseParams).mode).toBe("pulse");
  });

  it("updates the response sliders through state updaters", async () => {
    const setParams = vi.fn();

    render(
      <ControlPanel
        params={baseParams}
        setParams={setParams}
        audioRef={{ current: null }}
        audioSrc="/sample.wav"
        sourceLabel="Bundled sample"
        onFileSelect={vi.fn()}
        onUseSample={vi.fn()}
        visible
        toggle={vi.fn()}
      />
    );

    const sliders = screen.getAllByRole("slider");

    fireEvent.change(sliders[0], { target: { value: "1.5" } });
    fireEvent.change(sliders[1], { target: { value: "1.4" } });
    fireEvent.change(sliders[2], { target: { value: "1.3" } });

    const sensitivityUpdater = setParams.mock.calls[0][0] as (
      current: VisualParams
    ) => VisualParams;
    const flowUpdater = setParams.mock.calls[1][0] as (
      current: VisualParams
    ) => VisualParams;
    const particlesUpdater = setParams.mock.calls[2][0] as (
      current: VisualParams
    ) => VisualParams;

    expect(sensitivityUpdater(baseParams).sensitivity).toBe(1.5);
    expect(flowUpdater(baseParams).flow).toBe(1.4);
    expect(particlesUpdater(baseParams).particles).toBe(1.3);
  });
});
