import { STATUS, STATUS_FLOW, STATUS_LABELS, statusIndex } from "../data/orders";

const STEP_NOTES = {
  [STATUS.PENDING]: "Order placed, waiting for a rider",
  [STATUS.ASSIGNED]: "Rider assigned to pickup",
  [STATUS.ACCEPTED]: "Rider accepted the delivery",
  [STATUS.PICKED_UP]: "Package collected from pickup point",
  [STATUS.IN_TRANSIT]: "On the way to the delivery address",
  [STATUS.DELIVERED]: "Handed over to customer",
};

export default function DeliveryTimeline({ status }) {
  if (status === STATUS.CANCELLED) {
    return (
      <div className="timeline">
        <div className="timeline-step">
          <div className="timeline-marker">
            <div className="timeline-dot cancelled">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="timeline-step-body">
            <p className="timeline-step-title">Order cancelled</p>
            <p className="timeline-step-sub">This delivery will not be fulfilled.</p>
          </div>
        </div>
      </div>
    );
  }

  const current = statusIndex(status);

  return (
    <div className="timeline">
      {STATUS_FLOW.map((stage, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <div className="timeline-step" key={stage}>
            <div className="timeline-marker">
              <div className={"timeline-dot" + (done ? " done" : "") + (isCurrent ? " current" : "")}>
                {done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={"timeline-connector" + (done ? " done" : "")} />
              )}
            </div>
            <div className="timeline-step-body">
              <p className="timeline-step-title">{STATUS_LABELS[stage]}</p>
              <p className="timeline-step-sub">{STEP_NOTES[stage]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
