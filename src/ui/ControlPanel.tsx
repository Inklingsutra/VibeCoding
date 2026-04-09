type Props = {
  params: any;
  setParams: any;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  visible: boolean;
  toggle: () => void;
};

export default function ControlPanel({
  params,
  setParams,
  audioRef,
  visible,
  toggle,
}: Props) {
  return (
    <>
      <button
        onClick={toggle}
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 10,
        }}
      >
        {visible ? "Hide UI" : "Show UI"}
      </button>

      {visible && (
        <div
          style={{
            position: "fixed",
            top: 50,
            right: 10,
            background: "rgba(0,0,0,0.6)",
            padding: 10,
            borderRadius: 10,
            zIndex: 10,
          }}
        >
          <audio
            ref={audioRef}
            controls
            src="/sample.wav"
            onPlay={() => console.log("HTML audio playing")}
          />

          <div>
            Sensitivity
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={params.sensitivity}
              onChange={(e) =>
                setParams({ ...params, sensitivity: +e.target.value })
              }
            />
          </div>

          <div>
            Flow
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={params.flow}
              onChange={(e) =>
                setParams({ ...params, flow: +e.target.value })
              }
            />
          </div>

          <div>
            Particles
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={params.particles}
              onChange={(e) =>
                setParams({ ...params, particles: +e.target.value })
              }
            />
          </div>
        </div>
      )}
    </>
  );
}