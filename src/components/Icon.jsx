const ICONS = {
  package: (
    <path d="M21 8.5v7l-9 4.5-9-4.5v-7L12 4l9 4.5Z M3 8.5 12 13l9-4.5 M12 13v8.5" />
  ),
  clock: <path d="M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  inbox: (
    <path d="M4 12h4l2 3h4l2-3h4M5 12 6.5 5h11L19 12v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6Z" />
  ),
  route: <path d="M4 18 L10 8 L15 14 L20 6" />,
  check: <path d="M5 13l4 4L19 7" />,
  users: (
    <path d="M17 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 7 19.5V21M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 21v-1.5a3 3 0 0 0-2.2-2.9M17 5.1a3 3 0 0 1 0 5.8" />
  ),
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  truck: (
    <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7v-5ZM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
  ),
  alert: (
    <path d="M12 9v4M12 17h.01M10.3 3.9 2.7 17.5A1.6 1.6 0 0 0 4.1 20h15.8a1.6 1.6 0 0 0 1.4-2.5L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z" />
  ),
  "arrow-left": <path d="M19 12H5M12 5l-7 7 7 7" />,
  pin: (
    <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  ),
  bell: (
    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9ZM10 18a2 2 0 0 0 4 0" />
  ),
  phone: (
    <path d="M4.5 4h3.2l1.3 4-2 1.4a11 11 0 0 0 5.6 5.6l1.4-2 4 1.3v3.2c0 1-.9 1.8-1.9 1.6A16.5 16.5 0 0 1 3 5.9C2.8 4.9 3.6 4 4.5 4Z" />
  ),
  bike: (
    <path d="M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 16l3-7h5l2 4M9 9h4M18 16l-2.5-6" />
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  refresh: (
    <path d="M4 4v5h5M20 20v-5h-5M4.5 15a8 8 0 0 0 14.1 3.2M19.5 9A8 8 0 0 0 5.4 5.8" />
  ),
};

export default function Icon({ name, size = 16, className = "" }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
