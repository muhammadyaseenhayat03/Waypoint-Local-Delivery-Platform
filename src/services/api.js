import { ENV } from "../config/env";
import { seedUsers } from "../data/users";
import { seedOrders, nextOrderId, STATUS } from "../data/orders";
import { seedNotifications, NOTIFICATION_COPY } from "../data/notifications";

const USERS_KEY = "waypoint.users";
const ORDERS_KEY = "waypoint.orders";
const NOTIFICATIONS_KEY = "waypoint.notifications";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {

  }
  return fallback;
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function shouldFail() {
  if (typeof window !== "undefined" && window.__forceApiFailure) return true;
  return Math.random() < ENV.apiFailureRate;
}

function delay(ms = ENV.apiDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(fn, { failureMessage = "Request failed. Please try again." } = {}) {
  await delay();
  if (shouldFail()) {
    throw new Error(failureMessage);
  }
  return fn();
}

function touch(order) {
  return { ...order, updatedAt: new Date().toISOString() };
}

export function getUsers() {
  return request(() => readJSON(USERS_KEY, null) || seedUsers, { failureMessage: "Could not load accounts." });
}

export function saveUsers(users) {
  return request(() => {
    writeJSON(USERS_KEY, users);
    return users;
  });
}

export function login(email, password) {
  return request(
    () => {
      const users = readJSON(USERS_KEY, seedUsers);
      const match = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      if (!match) throw new Error("Email or password is incorrect.");
      return match;
    },
    { failureMessage: "Sign in failed. Please try again." }
  );
}

export function getOrders() {
  return request(() => readJSON(ORDERS_KEY, null) || seedOrders, { failureMessage: "Could not load orders." });
}

function withOrders(mutate) {
  return request(() => {
    const orders = readJSON(ORDERS_KEY, seedOrders);
    const { orders: nextOrders, result } = mutate(orders);
    writeJSON(ORDERS_KEY, nextOrders);
    return result;
  });
}

export function createOrder(data, businessId) {
  return withOrders((orders) => {
    const id = nextOrderId(orders);
    const order = {
      id,
      businessId,
      customerId: null,
      riderId: null,
      riderName: null,
      status: STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    return { orders: [order, ...orders], result: order };
  });
}

export function updateOrder(id, patch) {
  return withOrders((orders) => {
    let updated = null;
    const next = orders.map((o) => {
      if (o.id !== id) return o;
      updated = touch({ ...o, ...patch });
      return updated;
    });
    return { orders: next, result: updated };
  });
}

export function assignRider(id, rider) {
  return updateOrder(id, { riderId: rider.id, riderName: rider.name, status: STATUS.ASSIGNED });
}

export function updateDeliveryStatus(id, status) {
  return updateOrder(id, { status });
}

export function getNotifications() {
  return request(() => readJSON(NOTIFICATIONS_KEY, null) || seedNotifications, {
    failureMessage: "Could not load notifications.",
  });
}

export function saveNotifications(notifications) {
  return request(() => {
    writeJSON(NOTIFICATIONS_KEY, notifications);
    return notifications;
  });
}

export function buildNotification(order, type) {
  const build = NOTIFICATION_COPY[type];
  return {
    id: `ntf-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    orderId: order.id,
    businessId: order.businessId,
    riderId: order.riderId,
    customerId: order.customerId,
    customerName: order.customerName,
    type,
    message: build ? build(order) : `Order #${order.id} was updated.`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}
