import Icon from "./Icon";
import Spinner from "./Spinner";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  pendingLabel,
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={loading ? undefined : onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon modal-icon-${tone}`}>
          <Icon name="alert" size={18} />
        </div>
        <h3 className="modal-title">{title}</h3>
        {body && <p className="modal-body">{body}</p>}
        <div className="modal-actions">
          <button
            className="btn btn-subtle"
            onClick={onCancel}
            disabled={loading}
          >
            Go back
          </button>
          <button
            className={tone === "danger" ? "btn btn-danger" : "btn btn-amber"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={13} />
                {pendingLabel || "Processing…"}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
