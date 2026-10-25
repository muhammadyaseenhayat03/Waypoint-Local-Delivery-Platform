import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { STATUS } from "../../data/orders";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import EmptyState from "../../components/EmptyState";
import Icon from "../../components/Icon";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();

  const userId = user?.id;
  const { stats, urgentOpen, recent } = useMemo(() => {
    const mineOrders = orders.filter((o) => o.businessId === userId);
    return {
      stats: {
        total: mineOrders.length,
        pending: mineOrders.filter((o) => o.status === STATUS.PENDING).length,
        inDelivery: mineOrders.filter((o) =>
          [
            STATUS.ASSIGNED,
            STATUS.ACCEPTED,
            STATUS.PICKED_UP,
            STATUS.IN_TRANSIT,
          ].includes(o.status),
        ).length,
        completed: mineOrders.filter((o) => o.status === STATUS.DELIVERED)
          .length,
      },
      urgentOpen: mineOrders.filter(
        (o) =>
          o.priority === "Urgent" &&
          ![STATUS.DELIVERED, STATUS.CANCELLED].includes(o.status),
      ).length,
      recent: mineOrders.slice(0, 6),
    };
  }, [orders, userId]);

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="page-title">Welcome back, {user?.name || ""}</h1>
          <p className="page-sub">
            Here's how your deliveries are moving today.
          </p>
        </div>
        <Link to="/business/orders/new" className="btn btn-amber">
          <Icon name="package" size={15} />
          New order
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card stat-amber">
          <div className="stat-card-top">
            <p className="stat-label">Total orders</p>
            <span className="stat-icon stat-icon-amber">
              <Icon name="package" size={14} />
            </span>
          </div>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card stat-gold">
          <div className="stat-card-top">
            <p className="stat-label">Pending</p>
            <span className="stat-icon stat-icon-gold">
              <Icon name="clock" size={14} />
            </span>
          </div>
          <p className="stat-value">{stats.pending}</p>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-card-top">
            <p className="stat-label">In delivery</p>
            <span className="stat-icon stat-icon-blue">
              <Icon name="truck" size={14} />
            </span>
          </div>
          <p className="stat-value">{stats.inDelivery}</p>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-card-top">
            <p className="stat-label">Completed</p>
            <span className="stat-icon stat-icon-green">
              <Icon name="check" size={14} />
            </span>
          </div>
          <p className="stat-value">{stats.completed}</p>
        </div>
      </div>

      {urgentOpen > 0 && (
        <div className="alert-banner">
          <Icon name="bolt" size={16} />
          <span>
            <strong>{urgentOpen}</strong> urgent order
            {urgentOpen === 1 ? "" : "s"} still open — worth a look before
            anything else.
          </span>
          <button
            className="btn btn-sm btn-dark"
            onClick={() => navigate("/business/orders")}
          >
            Review
          </button>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2>Recent orders</h2>
          <Link to="/business/orders" className="btn btn-dark btn-sm">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Icon name="inbox" size={22} />}
            title="No orders yet"
            body="Create your first order to see it show up here."
            action={
              <Link to="/business/orders/new" className="btn btn-amber btn-sm">
                Create an order
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Rider</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr
                    key={o.id}
                    className={o.priority === "Urgent" ? "row-urgent" : ""}
                    onClick={() => navigate(`/business/orders/${o.id}`)}
                  >
                    <td className="order-id">{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>
                      <PriorityBadge priority={o.priority} size="sm" />
                    </td>
                    <td>{o.riderName || "Not assigned"}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
