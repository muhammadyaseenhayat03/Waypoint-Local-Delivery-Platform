import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as api from "../services/api";
import { startRealtimeSimulation } from "../services/realtime";
import { STATUS, canEditOrder, canAssignRider, canCancelOrder } from "../data/orders";

const OrdersContext = createContext(null);
const RECENTLY_TOUCHED_MS = 60000;

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [activeDeliveryId, setActiveDeliveryId] = useState(null);

  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const touchedRef = useRef(new Map());
  const markTouched = useCallback((id) => {
    touchedRef.current.set(id, Date.now());
  }, []);
  const isRecentlyTouched = useCallback((id, windowMs) => {
    const at = touchedRef.current.get(id);
    return at ? Date.now() - at < windowMs : false;
  }, []);

  const refreshOrders = useCallback(() => {
    setOrdersLoading(true);
    setOrdersError(null);
    return api
      .getOrders()
      .then((data) => setOrders(data))
      .catch((err) => setOrdersError(err.message || "Could not load orders."))
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  useEffect(() => {
    return startRealtimeSimulation({
      getOrders: () => ordersRef.current,
      isRecentlyTouched: (id) => isRecentlyTouched(id, RECENTLY_TOUCHED_MS),
      applyStatusChange: (id, status) => {
        api
          .updateDeliveryStatus(id, status)
          .then((updated) => {
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
          })
          .catch(() => {

          });
      },
    });
  }, [isRecentlyTouched]);

  const getOrder = useCallback((id) => orders.find((o) => o.id.toLowerCase() === String(id).toLowerCase()), [orders]);

  const createOrder = useCallback(async (data, businessId) => {
    const order = await api.createOrder(data, businessId);
    setOrders((prev) => [order, ...prev]);
    markTouched(order.id);
    return order;
  }, [markTouched]);

  const updateOrder = useCallback(async (id, patch) => {
    const updated = await api.updateOrder(id, patch);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    markTouched(id);
    return updated;
  }, [markTouched]);

  const editOrderDetails = useCallback(
    async (id, patch) => {
      const current = orders.find((o) => o.id === id);
      if (!current || !canEditOrder(current.status)) {
        return { ok: false, reason: "This order can no longer be edited." };
      }
      const riderChanging = "riderId" in patch && (patch.riderId || null) !== (current.riderId || null);
      if (riderChanging && !canAssignRider(current.status)) {
        return { ok: false, reason: "Rider assignment is locked for this order." };
      }
      try {
        await updateOrder(id, patch);
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: err.message || "Could not save changes. Please try again." };
      }
    },
    [orders, updateOrder]
  );

  const assignRider = useCallback(
    async (id, rider) => {
      const current = orders.find((o) => o.id === id);
      if (!current || !canAssignRider(current.status)) {
        return { ok: false, reason: "Rider assignment is locked for this order." };
      }
      try {
        await updateOrder(id, { riderId: rider.id, riderName: rider.name, status: STATUS.ASSIGNED });
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: err.message || "Could not assign the rider. Please try again." };
      }
    },
    [orders, updateOrder]
  );

  const cancelOrder = useCallback(
    async (id) => {
      const current = orders.find((o) => o.id === id);
      if (!current || !canCancelOrder(current.status)) {
        return { ok: false, reason: "This order can no longer be cancelled." };
      }
      try {
        await updateOrder(id, { status: STATUS.CANCELLED });
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: err.message || "Could not cancel the order. Please try again." };
      }
    },
    [orders, updateOrder]
  );

  const applyDeliveryStatus = useCallback(
    async (id, status) => {
      const previous = orders.find((o) => o.id === id);
      if (!previous) return { ok: false, reason: "Order not found." };

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)));
      markTouched(id);

      try {
        const updated = await api.updateDeliveryStatus(id, status);
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        return { ok: true };
      } catch (err) {
        setOrders((prev) => prev.map((o) => (o.id === id ? previous : o)));
        return { ok: false, reason: err.message || "That update didn't go through. Please try again." };
      }
    },
    [orders, markTouched]
  );

  const acceptDelivery = useCallback((id) => applyDeliveryStatus(id, STATUS.ACCEPTED), [applyDeliveryStatus]);
  const markPickedUp = useCallback((id) => applyDeliveryStatus(id, STATUS.PICKED_UP), [applyDeliveryStatus]);
  const startTransit = useCallback((id) => applyDeliveryStatus(id, STATUS.IN_TRANSIT), [applyDeliveryStatus]);
  const markDelivered = useCallback((id) => applyDeliveryStatus(id, STATUS.DELIVERED), [applyDeliveryStatus]);

  const value = useMemo(
    () => ({
      orders,
      ordersLoading,
      ordersError,
      refreshOrders,
      activeDeliveryId,
      setActiveDeliveryId,
      getOrder,
      createOrder,
      updateOrder,
      editOrderDetails,
      assignRider,
      cancelOrder,
      acceptDelivery,
      markPickedUp,
      startTransit,
      markDelivered,
    }),
    [
      orders,
      ordersLoading,
      ordersError,
      refreshOrders,
      activeDeliveryId,
      getOrder,
      createOrder,
      updateOrder,
      editOrderDetails,
      assignRider,
      cancelOrder,
      acceptDelivery,
      markPickedUp,
      startTransit,
      markDelivered,
    ]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
