import { STATUS, routeProgress, simulatedWaypointLabel } from "../data/orders";
import Icon from "./Icon";

export default function DeliveryMap({ order }) {
  const cancelled = order.status === STATUS.CANCELLED;
  const hasRiderOnRoute = [STATUS.ACCEPTED, STATUS.PICKED_UP, STATUS.IN_TRANSIT, STATUS.DELIVERED].includes(order.status);
  const progress = cancelled ? 0 : routeProgress(order.status);
  const waypoint = simulatedWaypointLabel(order);

  return (
    <div className={"delivery-map" + (cancelled ? " delivery-map-cancelled" : "")}>
      <div className="delivery-map-track">
        <div className="delivery-map-fill" style={{ width: `${progress}%` }} />
        <div className="delivery-map-stop delivery-map-stop-start">
          <Icon name="pin" size={14} />
        </div>
        {hasRiderOnRoute && !cancelled && (
          <div className="delivery-map-rider" style={{ left: `${progress}%` }} title={waypoint}>
            <Icon name="bike" size={13} />
          </div>
        )}
        <div className="delivery-map-stop delivery-map-stop-end">
          <Icon name="pin" size={14} />
        </div>
      </div>
      <div className="delivery-map-labels">
        <div className="delivery-map-label">
          <span className="delivery-map-label-tag">Pickup</span>
          <span className="delivery-map-label-value">{order.pickup}</span>
        </div>
        <div className="delivery-map-label delivery-map-label-center">
          <span className="delivery-map-label-tag">Rider</span>
          <span className="delivery-map-label-value">{waypoint}</span>
        </div>
        <div className="delivery-map-label delivery-map-label-end">
          <span className="delivery-map-label-tag">Delivery</span>
          <span className="delivery-map-label-value">{order.delivery}</span>
        </div>
      </div>
    </div>
  );
}
