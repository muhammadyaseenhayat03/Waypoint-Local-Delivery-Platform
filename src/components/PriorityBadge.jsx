import { memo } from "react";
import Icon from "./Icon";

function PriorityBadge({ priority, size = "md" }) {
  const urgent = priority === "Urgent";
  return (
    <span className={`priority-pill priority-${size} ${urgent ? "priority-urgent" : "priority-standard"}`}>
      {urgent && <Icon name="bolt" size={11} className="priority-icon" />}
      {priority}
    </span>
  );
}

export default memo(PriorityBadge);
