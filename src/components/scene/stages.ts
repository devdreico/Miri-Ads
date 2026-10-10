import { smoothstep } from './utils';

export const STAGE_KEYS = [
  'hero',
  'digital',
  'physical',
  'logistics',
  'proof',
  'crew',
  'cta',
] as const;

export type SceneStage = (typeof STAGE_KEYS)[number];

export type StageVec3 = [number, number, number];

export interface StageKeyframe {
  camera: StageVec3;
  target: StageVec3;
  globePosition: StageVec3;
  globeScale: number;
  rotationSpeed: number;
  arcIntensity: number;
  bloomIntensity: number;
  dim: number;
  focusNodeId: string | null;
  focusDistance: number;
  focusBlend: number;
}

export interface StageState extends StageKeyframe {
  focusWeight: number;
}

const FOCUS_DISTANCE = 1.15;

const PROMINENT_STAGE_INDICES: readonly number[] = [0, STAGE_KEYS.length - 1];
const PROMINENT_INNER = 0.28;
const PROMINENT_OUTER = 0.62;

export const stageKeyframes: Record<SceneStage, StageKeyframe> = {
  hero: {
    camera: [0.3, 0.14, 3.02],
    target: [0.12, 0, 0],
    globePosition: [0.52, 0.02, 0],
    globeScale: 1.12,
    rotationSpeed: 0.05,
    arcIntensity: 1,
    bloomIntensity: 1.1,
    dim: 1,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
  },
  digital: {
    camera: [-0.15, 0.2, 3.9],
    target: [-0.12, 0.02, 0],
    globePosition: [1.6, 0.1, -0.45],
    globeScale: 0.66,
    rotationSpeed: 0.09,
    arcIntensity: 0.5,
    bloomIntensity: 0.42,
    dim: 0.45,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
  },
  physical: {
    camera: [0, 0.06, 3.35],
    target: [0.05, 0, 0],
    globePosition: [1.5, -0.02, -0.3],
    globeScale: 0.6,
    rotationSpeed: 0.05,
    arcIntensity: 0.7,
    bloomIntensity: 0.48,
    dim: 0.42,
    focusNodeId: 'lim',
    focusDistance: 2.2,
    focusBlend: 0.22,
  },
  logistics: {
    camera: [0.15, 2.5, 1.9],
    target: [0, 0.05, 0],
    globePosition: [1.05, -0.22, -0.35],
    globeScale: 0.58,
    rotationSpeed: 0.025,
    arcIntensity: 1.15,
    bloomIntensity: 0.52,
    dim: 0.4,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
  },
  proof: {
    camera: [0, 0.25, 4.4],
    target: [0, 0, 0],
    globePosition: [1.78, 0.06, -0.8],
    globeScale: 0.5,
    rotationSpeed: 0.03,
    arcIntensity: 0.35,
    bloomIntensity: 0.28,
    dim: 0.3,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
  },
  crew: {
    camera: [0.05, 0.12, 3.7],
    target: [-0.1, 0, 0],
    globePosition: [1.62, 0.12, -0.4],
    globeScale: 0.6,
    rotationSpeed: 0.26,
    arcIntensity: 0.45,
    bloomIntensity: 0.42,
    dim: 0.45,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
  },
  cta: {
    camera: [0, 0, 3.1],
    target: [0, 0, 0],
    globePosition: [0, -0.04, 0],
    globeScale: 1.12,
    rotationSpeed: 0.055,
    arcIntensity: 1.45,
    bloomIntensity: 1.5,
    dim: 1,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
  },
};

export function stageIndexOf(key: string): number {
  const keys: readonly string[] = STAGE_KEYS;
  return keys.indexOf(key);
}

export function clampStageProgress(value: number): number {
  const max = STAGE_KEYS.length - 1;
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

/**
 * 1 when the scene sits on a "protagonist" stage (hero / cta) and 0 when the
 * copy owns the screen. Drives city-label visibility and the mobile rebalance.
 */
export function prominentStageWeight(progress: number): number {
  const value = clampStageProgress(progress);
  let weight = 0;
  for (let i = 0; i < PROMINENT_STAGE_INDICES.length; i += 1) {
    const distance = Math.abs(value - PROMINENT_STAGE_INDICES[i]);
    weight = Math.max(weight, 1 - smoothstep(PROMINENT_INNER, PROMINENT_OUTER, distance));
  }
  return weight;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpKeyframes(a: StageKeyframe, b: StageKeyframe, t: number): StageKeyframe {
  return {
    camera: [lerp(a.camera[0], b.camera[0], t), lerp(a.camera[1], b.camera[1], t), lerp(a.camera[2], b.camera[2], t)],
    target: [lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t)],
    globePosition: [
      lerp(a.globePosition[0], b.globePosition[0], t),
      lerp(a.globePosition[1], b.globePosition[1], t),
      lerp(a.globePosition[2], b.globePosition[2], t),
    ],
    globeScale: lerp(a.globeScale, b.globeScale, t),
    rotationSpeed: lerp(a.rotationSpeed, b.rotationSpeed, t),
    arcIntensity: lerp(a.arcIntensity, b.arcIntensity, t),
    bloomIntensity: lerp(a.bloomIntensity, b.bloomIntensity, t),
    dim: lerp(a.dim, b.dim, t),
    focusNodeId: a.focusNodeId ?? b.focusNodeId,
    focusDistance: lerp(a.focusDistance, b.focusDistance, t),
    focusBlend: lerp(a.focusBlend, b.focusBlend, t),
  };
}

export function createStageState(): StageState {
  return {
    camera: [0, 0, 3.2],
    target: [0, 0, 0],
    globePosition: [0, 0, 0],
    globeScale: 1,
    rotationSpeed: 0.05,
    arcIntensity: 1,
    bloomIntensity: 1.1,
    dim: 1,
    focusNodeId: null,
    focusDistance: FOCUS_DISTANCE,
    focusBlend: 0,
    focusWeight: 0,
  };
}

export function writeStageState(progress: number, out: StageState): StageState {
  const max = STAGE_KEYS.length - 1;
  const value = clampStageProgress(progress);
  const index = Math.min(Math.floor(value), max - 1);
  const t = value - index;
  const a = stageKeyframes[STAGE_KEYS[index]];
  const b = stageKeyframes[STAGE_KEYS[index + 1]];

  lerpVec(a.camera, b.camera, t, out.camera);
  lerpVec(a.target, b.target, t, out.target);
  lerpVec(a.globePosition, b.globePosition, t, out.globePosition);
  out.globeScale = lerp(a.globeScale, b.globeScale, t);
  out.rotationSpeed = lerp(a.rotationSpeed, b.rotationSpeed, t);
  out.arcIntensity = lerp(a.arcIntensity, b.arcIntensity, t);
  out.bloomIntensity = lerp(a.bloomIntensity, b.bloomIntensity, t);
  out.dim = lerp(a.dim, b.dim, t);
  out.focusDistance = lerp(a.focusDistance, b.focusDistance, t);
  out.focusBlend = lerp(a.focusBlend, b.focusBlend, t);
  out.focusNodeId = a.focusNodeId ?? b.focusNodeId;

  const weightA = a.focusNodeId === null ? 0 : a.focusBlend;
  const weightB = b.focusNodeId === null ? 0 : b.focusBlend;
  out.focusWeight = weightA + (weightB - weightA) * t;

  return out;
}

function lerpVec(a: StageVec3, b: StageVec3, t: number, out: StageVec3): StageVec3 {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
}
