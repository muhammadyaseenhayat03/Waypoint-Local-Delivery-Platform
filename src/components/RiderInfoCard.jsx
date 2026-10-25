import { getRider, riderCurrentStatus } from "../data/orders";
import Icon from "./Icon";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RiderInfoCard({ order }) {
  const rider = order.riderId ? getRider(order.riderId) : null;

  if (!rider) {
    return (
      <div className="rider-card rider-card-empty">
        <div className="rider-card-avatar rider-card-avatar-empty">
          <Icon name="bike" size={16} />
        </div>
        <div>
          <p className="rider-card-name">No rider assigned yet</p>
          <p className="rider-card-sub">A rider will appear here once one is assigned to this order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rider-card">
      <div className="rider-card-avatar">{initials(rider.name)}</div>
      <div className="rider-card-body">
        <p className="rider-card-name">{rider.name}</p>
        <p className="rider-card-status">{riderCurrentStatus(order.status)}</p>
        <div className="rider-card-meta">
          <span>
            <Icon name="phone" size={12} className="rider-card-meta-icon" />
            {rider.phone}
          </span>
          <span>
            <Icon name="bike" size={12} className="rider-card-meta-icon" />
            {rider.vehicle}
          </span>
        </div>
      </div>
    </div>
  );
}
