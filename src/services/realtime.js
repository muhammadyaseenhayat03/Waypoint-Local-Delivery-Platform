import { ENV } from "../config/env";
import { STATUS, STATUS_FLOW, statusIndex } from "../data/orders";

const RECENT_TOUCH_MS = 60000;

function nextStatus(status) {
  const idx = statusIndex(status);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export function startRealtimeSimulation({ getOrders, isRecentlyTouched, applyStatusChange }) {
  if (!ENV.realtimeIntervalMs) return () => {};

  const timer = setInterval(() => {
    const orders = getOrders();
    const eligible = orders.filter(
      (o) =>
        [STATUS.ASSIGNED, STATUS.ACCEPTED, STATUS.PICKED_UP, STATUS.IN_TRANSIT].includes(o.status) &&
        !isRecentlyTouched(o.id, RECENT_TOUCH_MS)
    );
    if (eligible.length === 0) return;

    const target = eligible[Math.floor(Math.random() * eligible.length)];
    const next = nextStatus(target.status);
    if (next) applyStatusChange(target.id, next);
  }, ENV.realtimeIntervalMs);

  return () => clearInterval(timer);
}
