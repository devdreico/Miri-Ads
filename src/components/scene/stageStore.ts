export type StageListener = (progress: number) => void;

let stageProgress = 0;

const listeners = new Set<StageListener>();

export function getStageProgress(): number {
  return stageProgress;
}

export function setStageProgress(next: number): void {
  if (next === stageProgress) return;
  stageProgress = next;
  listeners.forEach((listener) => {
    listener(stageProgress);
  });
}

export function subscribeStage(listener: StageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
