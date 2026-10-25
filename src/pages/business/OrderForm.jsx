import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { useToast } from "../../context/ToastContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { PRIORITIES, PAYMENT_METHODS, RIDERS, STATUS, canEditOrder, canAssignRider } from "../../data/orders";
import { ROLES } from "../../data/users";
import Spinner from "../../components/Spinner";
import Icon from "../../components/Icon";

const PHONE_PATTERN = /^[+\d][\d\s-]{7,}$/;

function validate(form) {
  if (!form.customerName.trim()) return "Customer name is required.";
  if (!form.customerPhone.trim() || !PHONE_PATTERN.test(form.customerPhone.trim())) {
    return "Enter a valid phone number (digits, spaces, or dashes, at least 8 characters).";
  }
  if (!form.pickup.trim()) return "Pickup address is required.";
  if (!form.delivery.trim()) return "Delivery address is required.";
  if (form.pickup.trim().toLowerCase() === form.delivery.trim().toLowerCase()) {
    return "Pickup and delivery addresses can't be the same.";
  }
  return null;
}

function emptyForm() {
  return {
    customerId: "",
    customerName: "",
    customerPhone: "",
    pickup: "",
    delivery: "",
    packageDetails: "",
    priority: "Standard",
    paymentMethod: "Cash on delivery",
    riderId: "",
  };
}

export default function OrderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user, users } = useAuth();
  const { getOrder, createOrder, editOrderDetails } = useOrders();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, runSubmit] = useAsyncAction();

  const customerAccounts = users.filter((u) => u.role === ROLES.CUSTOMER);

  const existingRaw = isEdit ? getOrder(id) : null;
  // Ownership check: only the business that created the order may edit it —
  // matching an id alone isn't enough once more than one business exists.
  const existing = existingRaw && existingRaw.businessId === user.id ? existingRaw : null;
  const [form, setForm] = useState(() =>
    existing
      ? {
          customerId: existing.customerId || "",
          customerName: existing.customerName,
          customerPhone: existing.customerPhone,
          pickup: existing.pickup,
          delivery: existing.delivery,
          packageDetails: existing.packageDetails,
          priority: existing.priority,
          paymentMethod: existing.paymentMethod,
          riderId: existing.riderId || "",
        }
      : emptyForm(),
  );
  const [error, setError] = useState("");

  if (isEdit && !existing) {
    return (
      <div className="notfound">
        <p className="eyebrow">Not found</p>
        <h1 className="page-title">No order matches "{id}"</h1>
        <button
          className="btn btn-amber"
          onClick={() => navigate("/business/orders")}
        >
          Back to orders
        </button>
      </div>
    );
  }

  if (isEdit && existing && !canEditOrder(existing.status)) {
    return (
      <div className="notfound">
        <div className="empty-state-icon" style={{ margin: "0 auto 16px" }}>
          <Icon name="alert" size={22} />
        </div>
        <p className="eyebrow">Locked</p>
        <h1 className="page-title">
          Order #{existing.id} can no longer be edited
        </h1>
        <p className="page-sub" style={{ margin: "0 auto 20px" }}>
          Once a delivery has been picked up, its details are locked. You can
          still cancel it from the order page if needed.
        </p>
        <Link to={`/business/orders/${existing.id}`} className="btn btn-amber">
          View order
        </Link>
      </div>
    );
  }

  const riderLocked = isEdit && !canAssignRider(existing.status);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEnterKey(e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleCustomerAccountChange(value) {
    const account = customerAccounts.find((c) => c.id === value);
    setForm((prev) => ({
      ...prev,
      customerId: value,
      customerName: account ? account.name : prev.customerName,
    }));
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    const rider = RIDERS.find((r) => r.id === form.riderId) || null;
    const payload = {
      customerId: form.customerId || null,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      pickup: form.pickup,
      delivery: form.delivery,
      packageDetails: form.packageDetails,
      priority: form.priority,
      paymentMethod: form.paymentMethod,
    };

    if (!isEdit) {
      payload.riderId = rider ? rider.id : null;
      payload.riderName = rider ? rider.name : null;
      payload.status = rider ? STATUS.ASSIGNED : STATUS.PENDING;
    } else if (!riderLocked && (existing.riderId || null) !== (rider ? rider.id : null)) {
      payload.riderId = rider ? rider.id : null;
      payload.riderName = rider ? rider.name : null;
      payload.status = rider ? STATUS.ASSIGNED : STATUS.PENDING;
    }

    runSubmit(async () => {
      try {
        if (isEdit) {
          const result = await editOrderDetails(existing.id, payload);
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          showToast(`Order ${existing.id} updated.`);
          navigate(`/business/orders/${existing.id}`);
        } else {
          const created = await createOrder(payload, user.id);
          showToast(`Order ${created.id} created.`);
          navigate(`/business/orders/${created.id}`);
        }
      } catch (err) {
        setError(err.message || "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <p className="eyebrow">
          {isEdit ? `Editing order #${existing.id}` : "New order"}
        </p>
        <h1 className="page-title">{isEdit ? "Edit order" : "Create order"}</h1>
        <p className="page-sub">
          {isEdit
            ? "Update the customer, route, package, or rider for this order."
            : "Fill in the delivery details and optionally assign a rider right away."}
        </p>
      </div>

      <div
        className="panel form form-panel"
        role="form"
        aria-label={isEdit ? "Edit order" : "Create order"}
        onKeyDown={handleEnterKey}
      >
        <div className="form-grid">
          <label className="field field-span2">
            <span className="field-label">Customer account</span>
            <select
              className="field-input"
              autoComplete="off"
              value={form.customerId}
              onChange={(e) => handleCustomerAccountChange(e.target.value)}
            >
              <option value="">Walk-in customer — no Waypoint account</option>
              {customerAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.email}
                </option>
              ))}
            </select>
            {form.customerId && (
              <span className="field-hint">
                This order will appear under "My orders" for this customer.
              </span>
            )}
          </label>

          <label className="field">
            <span className="field-label">Customer name</span>
            <input
              className="field-input"
              autoComplete="off"
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              placeholder="e.g. Ali Khan"
            />
          </label>

          <label className="field">
            <span className="field-label">Customer phone</span>
            <input
              className="field-input"
              autoComplete="off"
              value={form.customerPhone}
              onChange={(e) => update("customerPhone", e.target.value)}
              placeholder="+92 3xx xxxxxxx"
            />
          </label>

          <label className="field">
            <span className="field-label">Pickup address</span>
            <input
              className="field-input"
              autoComplete="off"
              value={form.pickup}
              onChange={(e) => update("pickup", e.target.value)}
              placeholder="e.g. Mardan"
            />
          </label>

          <label className="field">
            <span className="field-label">Delivery address</span>
            <input
              className="field-input"
              autoComplete="off"
              value={form.delivery}
              onChange={(e) => update("delivery", e.target.value)}
              placeholder="e.g. Timergara"
            />
          </label>

          <label className="field field-span2">
            <span className="field-label">Package details</span>
            <input
              className="field-input"
              autoComplete="off"
              value={form.packageDetails}
              onChange={(e) => update("packageDetails", e.target.value)}
              placeholder="What's being delivered"
            />
          </label>

          <div className="field">
            <span className="field-label">Delivery priority</span>
            <div className="pill-select">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p}
                  className={
                    "pill-option" + (form.priority === p ? " active" : "")
                  }
                  onClick={() => update("priority", p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Payment method</span>
            <select
              className="field-input"
              value={form.paymentMethod}
              onChange={(e) => update("paymentMethod", e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <label className="field field-span2">
            <span className="field-label">Assign rider</span>
            <select
              className="field-input"
              autoComplete="off"
              value={form.riderId}
              onChange={(e) => update("riderId", e.target.value)}
              disabled={riderLocked || submitting}
            >
              <option value="">No rider yet — assign later</option>
              {RIDERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.vehicle}
                </option>
              ))}
            </select>
            {riderLocked ? (
              <span className="field-hint">
                Rider is locked once a delivery has been accepted.
              </span>
            ) : (
              <span className="field-hint">
                {isEdit
                  ? "Changing the rider updates the order details right away."
                  : "The order will be marked Assigned and the rider is notified."}
              </span>
            )}
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-subtle"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-amber"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size={14} />
                {isEdit ? "Saving…" : "Creating…"}
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
