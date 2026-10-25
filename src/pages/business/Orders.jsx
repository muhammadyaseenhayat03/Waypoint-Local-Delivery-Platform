import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { useToast } from "../../context/ToastContext";
import { useNotifications } from "../../context/NotificationsContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  STATUS,
  STATUS_LABELS,
  RIDERS,
  canEditOrder,
  canCancelOrder,
} from "../../data/orders";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import Icon from "../../components/Icon";

const PAGE_SIZE = 6;

const FILTERS = [
  "all",
  STATUS.PENDING,
  STATUS.ASSIGNED,
  STATUS.ACCEPTED,
  STATUS.PICKED_UP,
  STATUS.IN_TRANSIT,
  STATUS.DELIVERED,
  STATUS.CANCELLED,
];

const DATE_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

function withinDateFilter(order, dateFilter) {
  if (dateFilter === "all") return true;
  const created = new Date(order.createdAt);
  const now = new Date();
  const days = dateFilter === "today" ? 1 : dateFilter === "week" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return created >= cutoff;
}

const OrderTableRow = memo(function OrderTableRow({
  order,
  onOpen,
  onEdit,
  onCancelRequest,
}) {
  const editLocked = !canEditOrder(order.status);
  const cancelLocked = !canCancelOrder(order.status);
  return (
    <tr
      className={order.priority === "Urgent" ? "row-urgent" : ""}
      onClick={() => onOpen(order.id)}
    >
      <td className="order-id">{order.id}</td>
      <td>{order.customerName}</td>
      <td className="route-cell">
        {order.pickup} → {order.delivery}
      </td>
      <td>
        <PriorityBadge priority={order.priority} size="sm" />
      </td>
      <td>{order.riderName || "Not assigned"}</td>
      <td>
        <StatusBadge status={order.status} />
      </td>
      <td className="route-cell">{order.createdAt.slice(0, 10)}</td>
      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn"
          title="Edit"
          aria-label={`Edit order ${order.id}`}
          onClick={() => onEdit(order.id)}
          disabled={editLocked}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="icon-btn icon-btn-danger"
          title="Cancel order"
          aria-label={`Cancel order ${order.id}`}
          onClick={() => onCancelRequest(order)}
          disabled={cancelLocked}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
});

export default function BusinessOrders() {
  const { user } = useAuth();
  const { orders, cancelOrder } = useOrders();
  const { showToast } = useToast();
  const { pushError } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [cancelling, runCancel] = useAsyncAction();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [filter, setFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [page, setPage] = useState(1);

  const shownToastRef = useRef(null);
  useEffect(() => {
    const message = location.state?.toast;
    if (message && shownToastRef.current !== message) {
      shownToastRef.current = message;
      showToast(message);
      navigate(location.pathname, { replace: true, state: {} });
    }

  }, [location.state]);

  const userId = user?.id;
  const mine = useMemo(
    () => orders.filter((o) => o.businessId === userId),
    [orders, userId],
  );

  const hasActiveFilters =
    query.trim() !== "" || filter !== "all" || riderFilter !== "all" || dateFilter !== "all";

  const filtered = useMemo(() => {
    return mine.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (riderFilter === "unassigned" && o.riderId) return false;
      if (riderFilter !== "all" && riderFilter !== "unassigned" && o.riderId !== riderFilter) return false;
      if (!withinDateFilter(o, dateFilter)) return false;
      const q = debouncedQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.riderName || "").toLowerCase().includes(q)
      );
    });
  }, [mine, debouncedQuery, filter, riderFilter, dateFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filter, riderFilter, dateFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  function clearFilters() {
    setQuery("");
    setFilter("all");
    setRiderFilter("all");
    setDateFilter("all");
  }

  const openOrder = useCallback(
    (id) => navigate(`/business/orders/${id}`),
    [navigate],
  );
  const editOrder = useCallback(
    (id) => navigate(`/business/orders/${id}/edit`),
    [navigate],
  );
  const requestCancel = useCallback((order) => setCancelTarget(order), []);

  function handleCancelConfirm() {
    const target = cancelTarget;
    runCancel(async () => {
      try {
        const result = await cancelOrder(target.id);
        if (!result.ok) {
          showToast(result.reason, "error");
          setCancelTarget(null);
          return;
        }
        showToast(`Order ${target.id} cancelled.`, "info");
        setCancelTarget(null);
      } catch (err) {
        const message = err.message || "Could not cancel the order.";
        showToast(message, "error");
        pushError(target, message);
        setCancelTarget(null);
      }
    });
  }

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <div>
          <p className="eyebrow">Fleet</p>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">
            Every order you've created, and where it stands.
          </p>
        </div>
        <Link to="/business/orders/new" className="btn btn-amber">
          <Icon name="package" size={15} />
          New order
        </Link>
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={"filter-chip" + (filter === f ? " active" : "")}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="filter-controls">
        <label className="filter-select-wrap">
          <span className="field-label">Rider</span>
          <select className="filter-select" value={riderFilter} onChange={(e) => setRiderFilter(e.target.value)}>
            <option value="all">All riders</option>
            <option value="unassigned">Not assigned</option>
            {RIDERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select-wrap">
          <span className="field-label">Date</span>
          <select className="filter-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            {DATE_FILTERS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        {hasActiveFilters && (
          <button type="button" className="btn btn-subtle btn-sm filter-clear" onClick={clearFilters}>
            <Icon name="close" size={13} />
            Clear filters
          </button>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>
            {filtered.length === 0
              ? "0 orders"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </h2>
          <div className="search-field">
            <Icon name="search" size={14} className="search-field-icon" />
            <input
              className="search-input"
              placeholder="Search by order, customer, or rider"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name="inbox" size={22} />}
            title={
              mine.length === 0
                ? "No orders yet"
                : "No orders match your filters"
            }
            body={
              mine.length === 0
                ? "Create your first order to start building your delivery board."
                : "Try a different status filter or search term."
            }
            action={
              mine.length === 0 ? (
                <Link
                  to="/business/orders/new"
                  className="btn btn-amber btn-sm"
                >
                  Create an order
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Priority</th>
                  <th>Rider</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => (
                  <OrderTableRow
                    key={o.id}
                    order={o}
                    onOpen={openOrder}
                    onEdit={editOrder}
                    onCancelRequest={requestCancel}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && pageCount > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-status">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this order?"
        body={
          cancelTarget
            ? `Are you sure you want to cancel order ${cancelTarget.id}? This can't be undone.`
            : ""
        }
        confirmLabel="Cancel order"
        pendingLabel="Cancelling…"
        loading={cancelling}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
