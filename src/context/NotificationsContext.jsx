import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useOrders } from "./OrdersContext";
import * as api from "../services/api";
import { STATUS } from "../data/orders";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { orders, ordersLoading } = useOrders();
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const seenRef = useRef(null);

  useEffect(() => {
    api
      .getNotifications()
      .then((data) => setNotifications(data))
      .catch(() => setNotifications([]))
      .finally(() => setNotificationsLoading(false));
  }, []);

  useEffect(() => {
    if (ordersLoading) return;

    if (seenRef.current === null) {
      seenRef.current = new Map(orders.map((o) => [o.id, { status: o.status, riderId: o.riderId }]));
      return;
    }

    const seen = seenRef.current;
    const fresh = [];
    for (const order of orders) {
      const prev = seen.get(order.id);
      if (prev === undefined) {
        fresh.push(api.buildNotification(order, "created"));
        if (order.status !== STATUS.PENDING) {
          fresh.push(api.buildNotification(order, order.status));
        }
      } else if (prev.status !== order.status) {
        fresh.push(api.buildNotification(order, order.status));
      } else if (order.riderId && prev.riderId !== order.riderId) {
        fresh.push(api.buildNotification(order, order.status));
      }
    }
    if (fresh.length) {
      setNotifications((prev) => {
        const next = [...fresh, ...prev].slice(0, 100);
        api.saveNotifications(next).catch(() => {});
        return next;
      });
    }
    seenRef.current = new Map(orders.map((o) => [o.id, { status: o.status, riderId: o.riderId }]));
  }, [orders, ordersLoading]);

  const forUser = useCallback(
    (user) => {
      if (!user) return [];
      if (user.role === "business") return notifications.filter((n) => n.businessId === user.id);
      if (user.role === "rider") return notifications.filter((n) => n.riderId === user.id);
      if (user.role === "customer") {
        return notifications.filter((n) => n.customerId === user.id || n.customerName === user.name);
      }
      return [];
    },
    [notifications]
  );

  const markAllRead = useCallback(
    (user) => {
      const previous = notifications;
      const next = previous.map((n) => {
        const belongsToUser =
          (user.role === "business" && n.businessId === user.id) ||
          (user.role === "rider" && n.riderId === user.id) ||
          (user.role === "customer" && (n.customerId === user.id || n.customerName === user.name));
        return belongsToUser ? { ...n, read: true } : n;
      });
      setNotifications(next);
      api.saveNotifications(next).catch(() => setNotifications(previous));
    },
    [notifications]
  );

  const markOneRead = useCallback(
    (id) => {
      const previous = notifications;
      const next = previous.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n));
      setNotifications(next);
      api.saveNotifications(next).catch(() => setNotifications(previous));
    },
    [notifications]
  );

  const pushError = useCallback((order, message) => {
    setNotifications((prev) => {
      const entry = {
        ...api.buildNotification(order, "error"),
        message,
      };
      const next = [entry, ...prev].slice(0, 100);
      api.saveNotifications(next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ notificationsLoading, forUser, markAllRead, markOneRead, pushError }),
    [notificationsLoading, forUser, markAllRead, markOneRead, pushError]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
