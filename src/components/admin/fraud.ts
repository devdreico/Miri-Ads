export const FRAUD_DISTANCE_M = 200;

export function isFraudulent(offRoute: boolean, distanceM: number | null): boolean {
  if (offRoute) return true;
  if (distanceM !== null && distanceM > FRAUD_DISTANCE_M) return true;
  return false;
}
