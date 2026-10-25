import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationsContext";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { timeAgo } from "../utils/datetime";
import {
  RIDERS,
  STATUS,
  canEditOrder,
  canAssignRider,
  canCancelOrder,
  estimatedDeliveryLabel,
} from "../data/orders";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import DeliveryTimeline from "../components/DeliveryTimeline";
import DeliveryMap from "../components/DeliveryMap";
import RiderInfoCard from "../components/RiderInfoCard";
import ConfirmDialog from "../components/ConfirmDialog";
import Spinner from "../components/Spinner";
import Icon from "../components/Icon";

export default function OrderDetails({ backTo }) {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    getOrder,
    assignRider,
    cancelOrder,
    acceptDelivery,
    markPickedUp,
    startTransit,
    markDelivered,
    setActiveDeliveryId,
  } = useOrders();
  const { showToast } = useToast();
  const { pushError } = useNotifications();
  const navigate = useNavigate();

  const order = getOrder(id);
  const [riderChoice, setRiderChoice] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const [assigning, runAssign] = useAsyncAction();
  const [cancelling, runCancel] = useAsyncAction();
  const [actingOnDelivery, runDeliveryAction] = useAsyncAction();

  useEffect(() => {
    if (order) setActiveDeliveryId(order.id);
    return () => setActiveDeliveryId(null);
  }, [order, setActiveDeliveryId]);

  // Ownership check: being the right *role* isn't enough — a business, rider or
  // customer could otherwise open another account's order just by editing the
  // URL and see its customer name, phone number, and delivery details.
  const isBusiness = user.role === "business" && order?.businessId === user.id;
  const isAssignedRider = user.role === "rider" && order?.riderId === user.id;
  const isCustomer =
    user.role === "customer" &&
    order &&
    (order.customerId === user.id || order.customerName === user.name);
  const isAuthorized = Boolean(order) && (isBusiness || isAssignedRider || isCustomer);

  if (!order || !isAuthorized) {
    return (
      <div className="notfound">
        <div className="empty-state-icon" style={{ margin: "0 auto 16px" }}>
          <Icon name="alert" size={22} />
        </div>
        <p className="eyebrow">Not found</p>
        <h1 className="page-title">No order matches "{id}"</h1>
        <Link to={backTo || "/"} className="btn btn-amber">
          Back
        </Link>
      </div>
    );
  }

  const editAllowed = canEditOrder(order.status);
  const assignAllowed = canAssignRider(order.status);
  const cancelAllowed = canCancelOrder(order.status);

  function handleAssign() {
    const rider = RIDERS.find((r) => r.id === riderChoice);
    if (!rider || !assignAllowed) return;
    runAssign(async () => {
      try {
        const result = await assignRider(order.id, rider);
        if (!result.ok) {
          showToast(result.reason, "error");
          return;
        }
        navigate("/business/orders", {
          replace: true,
          state: {
            toast: `Order #${order.id} assigned to ${rider.name} successfully.`,
          },
        });
      } catch (err) {
        showToast(err.message || "Could not assign the rider.", "error");
        pushError(order, err.message || "Could not assign the rider.");
      }
    });
  }

  function handleCancelConfirm() {
    runCancel(async () => {
      try {
        const result = await cancelOrder(order.id);
        if (!result.ok) {
          showToast(result.reason, "error");
          setShowCancel(false);
          return;
        }
        showToast(`Order ${order.id} cancelled.`, "info");
        setShowCancel(false);
      } catch (err) {
        showToast(err.message || "Could not cancel the order.", "error");
        pushError(order, err.message || "Could not cancel the order.");
        setShowCancel(false);
      }
    });
  }

  function runOptimisticAction(action, successMessage) {
    runDeliveryAction(async () => {
      const result = await action(order.id);
      if (result.ok) {
        showToast(successMessage);
      } else {
        showToast(result.reason, "error");
        pushError(order, result.reason);
      }
    });
  }

  const handleAccept = () => runOptimisticAction(acceptDelivery, "Delivery accepted.");
  const handlePickedUp = () => runOptimisticAction(markPickedUp, "Marked as picked up.");
  const handleStartTransit = () => runOptimisticAction(startTransit, "Delivery is now in transit.");
  const handleDelivered = () => runOptimisticAction(markDelivered, "Order delivered.");

  return (
    <div className="page">
      <Link to={backTo || "/"} className="back-link">
        <Icon name="arrow-left" size={14} />
        Back
      </Link>

      <div className="page-header page-header-row">
        <div>
          <p className="eyebrow">Order details</p>
          <h1 className="page-title">Order #{order.id}</h1>
          <p className="page-sub">
            Placed {order.createdAt.slice(0, 10)} for {order.customerName}
          </p>
        </div>
        {isBusiness && editAllowed && (
          <Link
            to={`/business/orders/${order.id}/edit`}
            className="btn btn-dark"
          >
            <Icon name="package" size={15} />
            Edit order
          </Link>
        )}
      </div>

      <div className="detail-grid">
        <div className="panel detail-card">
          <div className="detail-row">
            <span className="detail-label">Customer</span>
            <span className="detail-value">{order.customerName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{order.customerPhone}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Rider</span>
            <span className="detail-value">
              {order.riderName || "Not assigned"}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Package</span>
            <span className="detail-value">{order.packageDetails || "—"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Priority</span>
            <span className="detail-value">
              <PriorityBadge priority={order.priority} />
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Payment</span>
            <span className="detail-value">{order.paymentMethod}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <StatusBadge status={order.status} />
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <span className="detail-label">Route</span>
            <div className="route-line">
              <span>{order.pickup}</span>
              <span className="divider" />
              <span>{order.delivery}</span>
            </div>
          </div>

          {isBusiness && (
            <div className="detail-actions">
              <div className="assign-row">
                <select
                  className="field-input"
                  value={riderChoice}
                  onChange={(e) => setRiderChoice(e.target.value)}
                  disabled={!assignAllowed || assigning}
                >
                  <option value="">
                    {order.riderId ? "Reassign rider…" : "Assign a rider…"}
                  </option>
                  {RIDERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-dark"
                  onClick={handleAssign}
                  disabled={!assignAllowed || !riderChoice || assigning}
                >
                  {assigning ? (
                    <>
                      <Spinner size={13} />
                      Assigning…
                    </>
                  ) : (
                    "Assign"
                  )}
                </button>
              </div>
              {!assignAllowed && (
                <p className="field-hint">
                  {order.riderId
                    ? "Rider is locked once a delivery has been accepted."
                    : "Rider assignment is closed for this order."}
                </p>
              )}
              <button
                className="btn btn-danger-outline"
                onClick={() => setShowCancel(true)}
                disabled={!cancelAllowed || assigning}
              >
                Cancel order
              </button>
            </div>
          )}

          {isAssignedRider && (
            <div className="detail-actions">
              {order.status === STATUS.ASSIGNED && (
                <button
                  className="btn btn-amber"
                  style={{ width: "100%" }}
                  onClick={handleAccept}
                  disabled={actingOnDelivery}
                >
                  {actingOnDelivery ? (
                    <Spinner size={14} />
                  ) : (
                    <Icon name="check" size={15} />
                  )}
                  {actingOnDelivery ? "Accepting…" : "Accept delivery"}
                </button>
              )}
              {order.status === STATUS.ACCEPTED && (
                <button
                  className="btn btn-amber"
                  style={{ width: "100%" }}
                  onClick={handlePickedUp}
                  disabled={actingOnDelivery}
                >
                  {actingOnDelivery ? (
                    <Spinner size={14} />
                  ) : (
                    <Icon name="package" size={15} />
                  )}
                  {actingOnDelivery ? "Updating…" : "Mark as picked up"}
                </button>
              )}
              {order.status === STATUS.PICKED_UP && (
                <button
                  className="btn btn-amber"
                  style={{ width: "100%" }}
                  onClick={handleStartTransit}
                  disabled={actingOnDelivery}
                >
                  {actingOnDelivery ? (
                    <Spinner size={14} />
                  ) : (
                    <Icon name="truck" size={15} />
                  )}
                  {actingOnDelivery ? "Updating…" : "Start transit"}
                </button>
              )}
              {order.status === STATUS.IN_TRANSIT && (
                <button
                  className="btn btn-amber"
                  style={{ width: "100%" }}
                  onClick={handleDelivered}
                  disabled={actingOnDelivery}
                >
                  {actingOnDelivery ? (
                    <Spinner size={14} />
                  ) : (
                    <Icon name="check" size={15} />
                  )}
                  {actingOnDelivery ? "Updating…" : "Mark as delivered"}
                </button>
              )}
              {order.status === STATUS.DELIVERED && (
                <div className="delivery-complete-panel">
                  <p className="delivery-complete-heading">
                    <Icon name="check" size={16} />
                    Delivered!
                  </p>
                  <p className="delivery-complete-sub">
                    Nice work — the package reached its destination.
                  </p>
                  <button
                    className="btn btn-dark"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={() => navigate("/rider/dashboard")}
                  >
                    Back to deliveries
                  </button>
                </div>
              )}
            </div>
          )}

          {isCustomer && order.status === STATUS.DELIVERED && (
            <div className="delivery-complete-panel">
              <p className="delivery-complete-heading">
                🎉 Your order has been delivered!
              </p>
              <p className="delivery-complete-sub">
                We hope you enjoy your order. Thank you for choosing Waypoint!
              </p>
              <button
                className="btn btn-dark"
                style={{ width: "100%", marginTop: 8 }}
                onClick={() => navigate("/customer/orders")}
              >
                Back to my orders
              </button>
            </div>
          )}
          {isCustomer && order.status !== STATUS.DELIVERED && (
            <p className="page-sub" style={{ marginTop: 16 }}>
              Questions about this order? Contact the business that placed it.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Delivery timeline</h2>
          </div>
          <DeliveryTimeline status={order.status} />
        </div>
      </div>

      <div className="panel tracking-panel">
        <div className="panel-header">
          <h2>
            <Icon name="pin" size={15} className="panel-header-icon" />
            Delivery tracking
          </h2>
          <span className="tracking-eta">{estimatedDeliveryLabel(order.status)}</span>
        </div>
        <div className="tracking-panel-body">
          <DeliveryMap order={order} />
          <RiderInfoCard order={order} />
          <p className="tracking-updated">Last updated {timeAgo(order.updatedAt)}</p>
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Cancel this order?"
        body={`Are you sure you want to cancel order ${order.id}? This can't be undone.`}
        confirmLabel="Cancel order"
        pendingLabel="Cancelling…"
        loading={cancelling}
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}
