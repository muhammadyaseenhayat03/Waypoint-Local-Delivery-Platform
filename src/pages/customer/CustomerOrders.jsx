import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { STATUS } from "../../data/orders";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import EmptyState from "../../components/EmptyState";
import Icon from "../../components/Icon";

export default function CustomerOrders() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [tab, setTab] = useState("current");

  const customerId = user?.id;
  const customerName = user?.name;
  const mine = useMemo(
    () => orders.filter((o) => o.customerId === customerId || (customerName && o.customerName === customerName)),
    [orders, customerId, customerName]
  );

  const { current, previous } = useMemo(
    () => ({
      current: mine.filter((o) => ![STATUS.DELIVERED, STATUS.CANCELLED].includes(o.status)),
      previous: mine.filter((o) => [STATUS.DELIVERED, STATUS.CANCELLED].includes(o.status)),
    }),
    [mine]
  );
  const list = tab === "current" ? current : previous;

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Customer</p>
        <h1 className="page-title">My orders</h1>
        <p className="page-sub">Everything you've ordered through Waypoint businesses.</p>
      </div>

      <div className="filter-row">
        <button className={"filter-chip" + (tab === "current" ? " active" : "")} onClick={() => setTab("current")}>
          Current ({current.length})
        </button>
        <button className={"filter-chip" + (tab === "previous" ? " active" : "")} onClick={() => setTab("previous")}>
          Previous ({previous.length})
        </button>
      </div>

      <div className="panel">
        {list.length === 0 ? (
          <EmptyState
            icon={<Icon name="inbox" size={22} />}
            title={tab === "current" ? "No active orders right now" : "No past orders yet"}
            body={tab === "current" ? "Anything you order will show up here while it's on its way." : "Delivered and cancelled orders will appear here."}
          />
        ) : (
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Route</th>
                  <th>Priority</th>
                  <th>Rider</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} onClick={() => navigate(`/customer/orders/${o.id}`)}>
                    <td className="order-id">{o.id}</td>
                    <td className="route-cell">
                      {o.pickup} → {o.delivery}
                    </td>
                    <td>
                      <PriorityBadge priority={o.priority} size="sm" />
                    </td>
                    <td>{o.riderName || "Not assigned"}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="route-cell">{o.createdAt.slice(0, 10)}</td>
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
