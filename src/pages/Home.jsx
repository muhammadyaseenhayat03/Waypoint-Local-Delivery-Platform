import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { STATUS, STATUS_LABELS } from "../data/orders";
import { ROLES, ROLE_HOME } from "../data/users";
import Loader from "../components/Loader";

const FEATURES = [
  {
    title: "One dashboard, all orders",
    body: "Business accounts see pending, in-delivery, and completed orders at a glance.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="8"
          height="8"
          rx="1.5"
          stroke="white"
          strokeWidth="2"
        />
        <rect
          x="13"
          y="3"
          width="8"
          height="8"
          rx="1.5"
          stroke="white"
          strokeWidth="2"
        />
        <rect
          x="3"
          y="13"
          width="8"
          height="8"
          rx="1.5"
          stroke="white"
          strokeWidth="2"
        />
        <rect
          x="13"
          y="13"
          width="8"
          height="8"
          rx="1.5"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    title: "Riders manage their own route",
    body: "Accept, pick up, and deliver — every rider sees only what's assigned to them.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 18 L10 8 L15 14 L20 6"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Customers track it themselves",
    body: "Type in an order number and see exactly where a delivery stands, no calls needed.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
        <path
          d="M20 20l-3.5-3.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const ACTIVE_STATUSES = [
  STATUS.ASSIGNED,
  STATUS.ACCEPTED,
  STATUS.PICKED_UP,
  STATUS.IN_TRANSIT,
];

function useHomeSummary(user, orders) {
  if (!user) {
    return {
      eyebrow: "How it works",
      body: "Businesses create orders, riders deliver them, and customers track their own — all from one login.",
      cta: { to: "/register", label: "Create an account" },
    };
  }

  if (user.role === ROLES.BUSINESS) {
    const mine = orders.filter((o) => o.businessId === user.id);
    const pending = mine.filter((o) => o.status === STATUS.PENDING).length;
    const inDelivery = mine.filter((o) =>
      ACTIVE_STATUSES.includes(o.status),
    ).length;
    return {
      eyebrow: "Your business, right now",
      body: `${mine.length} order${mine.length === 1 ? "" : "s"} on your board · ${pending} pending · ${inDelivery} out for delivery`,
      cta: { to: "/business/dashboard", label: "Open dashboard" },
    };
  }

  if (user.role === ROLES.RIDER) {
    const mine = orders.filter((o) => o.riderId === user.id);
    const active = mine.filter((o) =>
      [STATUS.ACCEPTED, STATUS.PICKED_UP, STATUS.IN_TRANSIT].includes(o.status),
    ).length;
    const pending = mine.filter((o) => o.status === STATUS.ASSIGNED).length;
    return {
      eyebrow: "Your route, right now",
      body: `${mine.length} delivery${mine.length === 1 ? "" : "ies"} assigned to you · ${active} active · ${pending} waiting on you to accept`,
      cta: { to: "/rider/dashboard", label: "Open deliveries" },
    };
  }

  const mine = orders.filter(
    (o) => o.customerId === user.id || o.customerName === user.name,
  );
  const current = mine.filter(
    (o) => ![STATUS.DELIVERED, STATUS.CANCELLED].includes(o.status),
  );
  const mostRecent = [...mine].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )[0];
  const body = mostRecent
    ? `${current.length} active order${current.length === 1 ? "" : "s"} · most recent: #${mostRecent.id} — ${STATUS_LABELS[mostRecent.status]}`
    : "You don't have any orders yet — once a business places one for you, it'll show up here.";

  return {
    eyebrow: "Your orders, right now",
    body,
    cta: { to: "/customer/orders", label: "View my orders" },
  };
}

export default function Home() {
  const { user, authLoading } = useAuth();
  const { orders, ordersLoading } = useOrders();
  const summary = useHomeSummary(user, orders);

  const summaryLoading = authLoading || ordersLoading;

  const primaryCta = user
    ? { to: ROLE_HOME[user.role] || "/", label: "Go to dashboard" }
    : { to: "/register", label: "Get started" };

  return (
    <>
      <section className="hero">
        <svg
          className="hero-route"
          viewBox="0 0 1120 420"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-40 360 C 180 320, 260 180, 460 190 S 760 340, 980 140 S 1180 60, 1300 20"
            stroke="#ffffff"
            strokeOpacity="0.08"
            strokeWidth="2"
            strokeDasharray="2 10"
            fill="none"
          />
          <circle cx="460" cy="190" r="4" fill="#E2751B" opacity="0.6" />
          <circle cx="980" cy="140" r="4" fill="#E2751B" opacity="0.4" />
        </svg>

        <div className="hero-inner">
          <div>
            <h1>Local Delivery Platform</h1>
            <p>
              From order creation to doorstep delivery — businesses, riders, and
              customers, all in one place.
            </p>
            <div className="hero-actions">
              <Link to={primaryCta.to} className="btn btn-amber">
                {primaryCta.label}
              </Link>
              <Link to="/track" className="btn btn-ghost">
                Track a delivery
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <p className="hero-card-tag">Example order</p>
            <div className="hero-card-row">
              <span className="hero-card-label">Order</span>
              <span className="hero-card-value">#DL001</span>
            </div>
            <div className="hero-card-row">
              <span className="hero-card-label">Route</span>
              <span className="hero-card-value">Mardan → Timergara</span>
            </div>
            <div className="hero-card-row">
              <span className="hero-card-label">Rider</span>
              <span className="hero-card-value">Hamza</span>
            </div>
            <div className="hero-card-row">
              <span className="hero-card-label">Status</span>
              <span className="hero-card-value">In transit</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div className="feature" key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <div className="panel cta-panel">
          {summaryLoading ? (
            <Loader inline size="sm" label="Loading…" />
          ) : (
            <>
              <div>
                <p className="eyebrow" style={{ margin: "0 0 4px" }}>
                  {summary.eyebrow}
                </p>
                <p style={{ margin: 0, fontSize: 15 }}>{summary.body}</p>
              </div>
              <Link to={summary.cta.to} className="btn btn-dark">
                {summary.cta.label}
              </Link>
            </>
          )}
        </div>
      </section>
    </>
  );
}
