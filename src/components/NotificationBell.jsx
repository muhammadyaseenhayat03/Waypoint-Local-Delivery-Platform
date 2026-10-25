import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyNotifications } from "../hooks/useMyNotifications";
import { timeAgo } from "../utils/datetime";
import Icon from "./Icon";

const ROLE_ORDER_ROUTE = {
  business: (id) => `/business/orders/${id}`,
  rider: (id) => `/rider/orders/${id}`,
  customer: (id) => `/customer/orders/${id}`,
};

export default function NotificationBell({ role }) {
  const { items, unreadCount, markAllRead, markOneRead } = useMyNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onClickAway(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  function openOrder(notifId, orderId) {
    markOneRead(notifId);
    setOpen(false);
    const toRoute = ROLE_ORDER_ROUTE[role];
    if (toRoute) navigate(toRoute(orderId));
  }

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" size={17} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button type="button" className="notif-mark-read" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="notif-empty">No notifications yet.</p>
          ) : (
            <div className="notif-list">
              {items.slice(0, 20).map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={"notif-item" + (n.read ? "" : " notif-item-unread") + (n.type === "error" ? " notif-item-error" : "")}
                  onClick={() => openOrder(n.id, n.orderId)}
                >
                  <span className="notif-item-dot" />
                  <span className="notif-item-body">
                    <span className="notif-item-message">{n.message}</span>
                    <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
