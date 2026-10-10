'use client';

import { useSyncExternalStore } from 'react';
import { planPrice, type Plan, type PlanCadence } from '@/lib/plans';

let selectedCadence: PlanCadence = 'monthly';
const listeners = new Set<() => void>();

const MONTHS_PER_CADENCE: Record<PlanCadence, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeCadence(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCadence(): PlanCadence {
  return selectedCadence;
}

export function setCadence(next: PlanCadence): void {
  if (selectedCadence === next) return;
  selectedCadence = next;
  emit();
}

export function useCadence(): PlanCadence {
  return useSyncExternalStore(subscribeCadence, getCadence, getCadence);
}

export function getSavings(plan: Plan, cadence: PlanCadence): number | null {
  if (cadence === 'monthly') return null;
  const months = MONTHS_PER_CADENCE[cadence];
  const fullPrice = plan.price.monthly * months;
  const savings = fullPrice - planPrice(plan, cadence);
  return savings > 0 ? savings : null;
}
