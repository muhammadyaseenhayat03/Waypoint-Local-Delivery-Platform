import Spinner from "./Spinner";

const SPINNER_SIZE = { sm: 16, md: 22, lg: 30 };

export default function Loader({
  label = "Loading…",
  size = "md",
  fullPage = false,
  inline = false,
}) {
  const content = (
    <div
      className={`loader loader-${size}${inline ? " loader-inline" : ""}`}
      role="status"
      aria-live="polite"
    >
      <Spinner size={SPINNER_SIZE[size] || SPINNER_SIZE.md} />
      {label && <span className="loader-label">{label}</span>}
    </div>
  );

  if (fullPage) {
    return <div className="loader-page">{content}</div>;
  }

  return content;
}
