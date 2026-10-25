function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const ENV = {
  apiDelayMs: toNumber(import.meta.env.VITE_API_DELAY_MS, 350),
  apiFailureRate: toNumber(import.meta.env.VITE_API_FAILURE_RATE, 0),
  realtimeIntervalMs: toNumber(import.meta.env.VITE_REALTIME_INTERVAL_MS, 20000),
};
