import { memo } from "react";
import { STATUS_LABELS } from "../data/orders";

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default memo(StatusBadge);
