import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { estimatedDeliveryLabel } from "../data/orders";
import { timeAgo } from "../utils/datetime";
import StatusBadge from "../components/StatusBadge";
import DeliveryTimeline from "../components/DeliveryTimeline";
import DeliveryMap from "../components/DeliveryMap";
import RiderInfoCard from "../components/RiderInfoCard";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";

export default function Track() {
  const { getOrder } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("order") || "";
  const [input, setInput] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);

  function handleSubmit(e) {
    e.preventDefault();
    const value = input.trim();
    setSubmitted(value);
    setSearchParams(value ? { order: value } : {});
  }

  const order = submitted ? getOrder(submitted) : null;

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Public tracking</p>
        <h1 className="page-title">Track delivery</h1>
        <p className="page-sub">Enter an order number to see exactly where it is right now — no login needed.</p>
      </div>

      <form className="track-search" onSubmit={handleSubmit}>
        <div className="search-field search-field-lg">
          <Icon name="search" size={15} className="search-field-icon" />
          <input className="search-input" placeholder="e.g. DL001" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <button className="btn btn-amber" type="submit">
          Track
        </button>
      </form>

      {!submitted && (
        <div className="panel">
          <EmptyState
            icon={<Icon name="route" size={22} />}
            title="Track a delivery in seconds"
            body={
              <>
                Try order <strong>DL001</strong> to see one currently in transit.
              </>
            }
          />
        </div>
      )}

      {submitted && !order && (
        <div className="panel">
          <EmptyState icon={<Icon name="alert" size={22} />} title={`No order found for "${submitted}"`} body="Check the order number and try again." />
        </div>
      )}

      {order && (
        <div className="detail-grid">
          <div className="panel detail-card">
            <div className="detail-row">
              <span className="detail-label">Order</span>
              <span className="detail-value order-id">{order.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Rider</span>
              <span className="detail-value">{order.riderName || "Not assigned"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Current status</span>
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
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Status</h2>
            </div>
            <DeliveryTimeline status={order.status} />
          </div>
        </div>
      )}

      {order && (
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
      )}
    </div>
  );
}
