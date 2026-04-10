export type VisualMode = "nebula" | "prism" | "pulse";

export type FrequencyBands = {
  bass: number;
  lowMid: number;
  mid: number;
  high: number;
};

export type VisualParams = {
  sensitivity: number;
  flow: number;
  particles: number;
  mode: VisualMode;
};

export type Shockwave = {
  radius: number;
  strength: number;
};

export type RenderParams = VisualParams & {
  shockwaves?: Shockwave[];
};
