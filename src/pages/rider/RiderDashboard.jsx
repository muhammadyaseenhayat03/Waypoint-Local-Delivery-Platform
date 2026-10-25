import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { STATUS } from "../../data/orders";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import EmptyState from "../../components/EmptyState";
import Icon from "../../components/Icon";

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

const OrderRow = memo(function OrderRow({ order, onOpen }) {
  return (
    <div
      className={
        "delivery-row" +
        (order.priority === "Urgent" ? " delivery-row-urgent" : "")
      }
      onClick={() => onOpen(order.id)}
    >
      <div className="delivery-row-main">
        <span className="order-id">{order.id}</span>
        <span className="route-cell">
          <Icon name="route" size={13} className="route-cell-icon" />
          {order.pickup} → {order.delivery}
        </span>
      </div>
      <div className="delivery-row-meta">
        <PriorityBadge priority={order.priority} size="sm" />
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
});

export default function RiderDashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();

  const userId = user?.id;
  const mine = useMemo(
    () => orders.filter((o) => o.riderId === userId),
    [orders, userId],
  );

  const groups = useMemo(
    () => ({
      today: mine.filter(
        (o) => isToday(o.updatedAt) && o.status !== STATUS.DELIVERED,
      ),
      pending: mine.filter((o) => o.status === STATUS.ASSIGNED),
      active: mine.filter((o) =>
        [STATUS.ACCEPTED, STATUS.PICKED_UP, STATUS.IN_TRANSIT].includes(
          o.status,
        ),
      ),
      completed: mine.filter((o) => o.status === STATUS.DELIVERED),
    }),
    [mine],
  );

  const open = useCallback((id) => navigate(`/rider/orders/${id}`), [navigate]);

  const sections = [
    {
      key: "today",
      title: "Today's deliveries",
      icon: "clock",
      items: groups.today,
      empty: "Nothing due today.",
    },
    {
      key: "pending",
      title: "Pending deliveries",
      icon: "inbox",
      items: groups.pending,
      empty: "No deliveries waiting on you.",
    },
    {
      key: "active",
      title: "Active deliveries",
      icon: "truck",
      items: groups.active,
      empty: "Nothing in progress right now.",
    },
    {
      key: "completed",
      title: "Completed deliveries",
      icon: "check",
      items: groups.completed,
      empty: "Nothing completed yet.",
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Rider</p>
        <h1 className="page-title">Hi {user.name}, here's your route</h1>
        <p className="page-sub">
          Deliveries assigned to you, grouped by where they stand.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card stat-amber">
          <div className="stat-card-top">
            <p className="stat-label">Today</p>
            <span className="stat-icon stat-icon-amber">
              <Icon name="clock" size={14} />
            </span>
          </div>
          <p className="stat-value">{groups.today.length}</p>
        </div>
        <div className="stat-card stat-gold">
          <div className="stat-card-top">
            <p className="stat-label">Pending</p>
            <span className="stat-icon stat-icon-gold">
              <Icon name="inbox" size={14} />
            </span>
          </div>
          <p className="stat-value">{groups.pending.length}</p>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-card-top">
            <p className="stat-label">Active</p>
            <span className="stat-icon stat-icon-blue">
              <Icon name="truck" size={14} />
            </span>
          </div>
          <p className="stat-value">{groups.active.length}</p>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-card-top">
            <p className="stat-label">Completed</p>
            <span className="stat-icon stat-icon-green">
              <Icon name="check" size={14} />
            </span>
          </div>
          <p className="stat-value">{groups.completed.length}</p>
        </div>
      </div>

      {sections.map((section) => (
        <div className="panel delivery-section" key={section.key}>
          <div className="panel-header">
            <h2>
              <Icon
                name={section.icon}
                size={15}
                className="panel-header-icon"
              />
              {section.title}
            </h2>
            <span className="section-count">{section.items.length}</span>
          </div>
          {section.items.length === 0 ? (
            <EmptyState
              icon={<Icon name="inbox" size={20} />}
              title={section.empty}
            />
          ) : (
            <div className="delivery-list">
              {section.items.map((o) => (
                <OrderRow key={o.id} order={o} onOpen={open} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
