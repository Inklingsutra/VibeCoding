import { useEffect, useRef, useState } from "react";
import { ControlPanel } from "./ui/ControlPanel";
import type { VisualParams } from "./types/visualization";
import { AudioEngine } from "./engine/AudioEngine";
import { CanvasRenderer } from "./visual/CanvasRenderer";
import "./App.css";

export default function App() {
  const defaultAudioSrc = "/sample.wav";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [params, setParams] = useState<VisualParams>({
    sensitivity: 1,
    flow: 1,
    particles: 1,
    mode: "nebula",
  });
  const paramsRef = useRef(params);
  const [showUI, setShowUI] = useState(true);
  const [audioSrc, setAudioSrc] = useState(defaultAudioSrc);
  const [sourceLabel, setSourceLabel] = useState("Bundled sample");

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !audioRef.current) return;

    const canvas = canvasRef.current;
    const audio = audioRef.current;

    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvas);
    }
    const renderer = rendererRef.current;

    let cancelled = false;

    const stopLoop = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const loop = () => {
      const engine = engineRef.current;

      if (!renderer || !engine || cancelled || audio.paused || audio.ended) {
        stopLoop();
        return;
      }

      const bands = engine.getFrequencyBands();
      const adjusted = {
        bass: bands.bass * paramsRef.current.sensitivity,
        lowMid: bands.lowMid * paramsRef.current.sensitivity,
        mid: bands.mid * paramsRef.current.sensitivity,
        high: bands.high * paramsRef.current.sensitivity,
      };

      renderer.render(adjusted, paramsRef.current);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    const handlePlay = async () => {
      if (!engineRef.current) {
        engineRef.current = new AudioEngine();
        engineRef.current.attachMediaElement(audio);
      }

      await engineRef.current.resume();

      if (animationFrameRef.current === null) {
        loop();
      }
    };

    const handlePause = () => {
      stopLoop();
      void engineRef.current?.suspend();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);

    return () => {
      cancelled = true;
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
      stopLoop();
      renderer.dispose();
      engineRef.current?.dispose();
      rendererRef.current = null;
      engineRef.current = null;
    };
  }, []);

  const updateAudioSource = (nextSource: string, nextLabel: string) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setAudioSrc(nextSource);
    setSourceLabel(nextLabel);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    objectUrlRef.current = nextUrl;
    updateAudioSource(nextUrl, file.name);
  };

  const handleUseSample = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    updateAudioSource(defaultAudioSrc, "Bundled sample");
  };

  return (
    <main className="app-shell">
      <canvas ref={canvasRef} />

      <section className="app-hud">
        <div className="app-brand">
          <p className="app-kicker">Audio Reactive Playground</p>
          <h1>Audio Visual Engine</h1>
          <p className="app-summary">
            Play the sample track and shape the field with sensitivity, flow,
            particle density, and visual mode controls.
          </p>
        </div>

        <div className="app-meta">
          <span>Canvas particles</span>
          <span>Web Audio analysis</span>
          <span>Live controls</span>
        </div>
      </section>

      <ControlPanel
        params={params}
        setParams={setParams}
        audioRef={audioRef}
        audioSrc={audioSrc}
        sourceLabel={sourceLabel}
        onFileSelect={handleFileSelect}
        onUseSample={handleUseSample}
        visible={showUI}
        toggle={() => setShowUI((current) => !current)}
      />

      <p className="app-credit">© inklingsutra 2026</p>
    </main>
  );
}
