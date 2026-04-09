import { useEffect, useRef, useState } from "react";
import { SignalProcessor } from "./engine/SignalProcessor";
import { CanvasRenderer } from "./visual/CanvasRenderer";
import ControlPanel from "./ui/ControlPanel";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const signalRef = useRef<SignalProcessor | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const [params, setParams] = useState({
    sensitivity: 1,
    flow: 1,
    particles: 1,
  });

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !audioRef.current) return;

    const canvas = canvasRef.current;
    const audio = audioRef.current;

    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvas);
    }

    if (!signalRef.current) {
      signalRef.current = new SignalProcessor(audio);
    }

    const renderer = rendererRef.current;
    const signal = signalRef.current;

    let running = false;

    const loop = () => {
      if (!renderer || !signal) return;

      const bands = signal.getFrequencyBands();

      const adjusted = {
        bass: bands.bass * paramsRef.current.sensitivity,
        lowMid: bands.lowMid * paramsRef.current.sensitivity,
        mid: bands.mid * paramsRef.current.sensitivity,
        high: bands.high * paramsRef.current.sensitivity,
      };

      renderer.render(adjusted, paramsRef.current);

      requestAnimationFrame(loop);
    };

    const handlePlay = async () => {
      console.log("PLAY triggered");

      await signal.audioCtx?.resume?.(); // ensure audio context active

      if (!running) {
        running = true;
        loop();
      }
    };

    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("play", handlePlay);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} />

      <ControlPanel
        params={params}
        setParams={setParams}
        audioRef={audioRef}
        visible={showUI}
        toggle={() => setShowUI(!showUI)}
      />

      <div
        style={{
          position: "fixed",
          bottom: 10,
          right: 10,
          color: "white",
          opacity: 0.5,
        }}
      >
        © inklingsutra 2026
      </div>
    </>
  );
}