import type {
  ChangeEvent,
  Dispatch,
  RefObject,
  SetStateAction,
} from "react";
import type { VisualMode, VisualParams } from "../types/visualization";

type Props = {
  params: VisualParams;
  setParams: Dispatch<SetStateAction<VisualParams>>;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioSrc: string;
  sourceLabel: string;
  onFileSelect: (file: File | null) => void;
  onUseSample: () => void;
  visible: boolean;
  toggle: () => void;
};

export function ControlPanel({
  params,
  setParams,
  audioRef,
  audioSrc,
  sourceLabel,
  onFileSelect,
  onUseSample,
  visible,
  toggle,
}: Props) {
  const modes: { value: VisualMode; label: string; description: string }[] = [
    { value: "nebula", label: "Nebula", description: "Soft bloom and drifting trails" },
    { value: "prism", label: "Prism", description: "Sharper beams and spectral color shifts" },
    { value: "pulse", label: "Pulse", description: "High-contrast rings with stronger impact flashes" },
  ];

  const handleParamChange =
    (key: keyof VisualParams) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      setParams((current) => ({ ...current, [key]: value }));
    };

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as VisualMode;
    setParams((current) => ({ ...current, mode: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  return (
    <>
      <button
        onClick={toggle}
        className="control-toggle"
      >
        {visible ? "Hide Controls" : "Show Controls"}
      </button>

      {visible && (
        <aside className="control-panel" aria-label="Playback and visualization controls">
          <div className="control-panel__section">
            <p className="control-panel__eyebrow">Playback</p>
            <audio
              ref={audioRef}
              controls
              src={audioSrc}
              className="control-panel__audio"
            />
            <div className="control-source">
              <span className="control-source__label">Current source</span>
              <strong className="control-source__value">{sourceLabel}</strong>
            </div>
            <div className="control-actions">
              <label className="control-action control-action--primary">
                <span>Upload audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="control-action__input"
                />
              </label>
              <button
                type="button"
                className="control-action"
                onClick={onUseSample}
              >
                Use sample
              </button>
            </div>
          </div>

          <div className="control-panel__section">
            <p className="control-panel__eyebrow">Response</p>

            <label className="control-mode">
              <span className="control-slider__label">Visual mode</span>
              <select
                className="control-mode__select"
                value={params.mode}
                onChange={handleModeChange}
              >
                {modes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="control-mode__description">
              {modes.find((mode) => mode.value === params.mode)?.description}
            </p>

            <label className="control-slider">
              <span className="control-slider__label">Sensitivity</span>
              <span className="control-slider__value">
                {params.sensitivity.toFixed(1)}
              </span>
            </label>
            <input
              className="control-slider__input"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={params.sensitivity}
              onChange={handleParamChange("sensitivity")}
            />

            <label className="control-slider">
              <span className="control-slider__label">Flow</span>
              <span className="control-slider__value">{params.flow.toFixed(1)}</span>
            </label>
            <input
              className="control-slider__input"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={params.flow}
              onChange={handleParamChange("flow")}
            />

            <label className="control-slider">
              <span className="control-slider__label">Particles</span>
              <span className="control-slider__value">
                {params.particles.toFixed(1)}
              </span>
            </label>
            <input
              className="control-slider__input"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={params.particles}
              onChange={handleParamChange("particles")}
            />
          </div>
        </aside>
      )}
    </>
  );
}
