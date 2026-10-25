# Waypoint — Local Delivery Platform

A local delivery and logistics management web app for three roles —
**Business**, **Rider**, and **Customer** — built as the final project of the
ZYROO Frontend Development Internship.

- **Live demo:** _add your deployed URL here after deploying (see "Deployment")_
- **Repository:** _add your GitHub URL here_

> **Honest scope note.** Waypoint is a **frontend-only** application. There is
> no real backend, database, or server. Login is **simulated**, and all data
> lives in the browser's `localStorage`. Details in
> ["What is real and what is simulated"](#what-is-real-and-what-is-simulated).

## Problem statement

Small local delivery businesses need a simple way to create orders, assign
riders, and let customers follow their package — without adopting a heavyweight
logistics platform. Waypoint models that workflow end to end: a business
creates and manages orders, a rider works through assigned deliveries, and a
customer tracks the order live. All three roles read and write one shared order
record, so nobody sees stale or duplicated data.

## Features

**Business**
- Create, edit, cancel orders; optionally pick a rider while creating
- Assign or reassign a rider (locked once the rider has accepted)
- Orders table with search (order ID / customer / rider), status, rider and
  date filters that combine, a **Clear filters** button, and pagination
- Dashboard with order statistics and an urgent-orders callout
- Edit / assign / cancel permissions depend on the order's status and are
  enforced in the data layer as well as in the UI

**Rider**
- Deliveries grouped into Today / Pending / Active / Completed
- Accept, mark picked up, start transit, mark delivered — updates appear
  instantly (optimistic) and roll back with an error if the request fails

**Customer**
- Current and previous orders, only for their own account
- Live tracking: delivery timeline, simulated route map, rider info card,
  estimated delivery, and "last updated" time

**Platform-wide**
- Role-based protected routes with a dedicated Unauthorized page
- In-app notifications (bell + unread badge), scoped to each role
- A simulated real-time channel that can advance an in-flight delivery
- Loading, empty, error + Retry, and success states
- Form validation (phone format, email format, pickup ≠ delivery, required fields)
- Lazy-loaded routes, debounced search, memoized derived data

## User roles

| Role | Can do |
| --- | --- |
| Business | Create/edit/cancel orders, assign/reassign riders, search/filter/paginate orders |
| Rider | Accept and progress deliveries assigned to them |
| Customer | View and track their own orders |

## Acceptance criteria

1. A business can create an order, assign a rider, and see its status change.
2. A rider can accept an order and move it through Picked up → In transit → Delivered.
3. A customer sees only their own orders and can track an order's progress.
4. Notifications appear for important order events.
5. Search, filters, and pagination return the expected orders.
6. Invalid form input is rejected with a clear message.
7. A user cannot open pages or perform actions that belong to another role.
8. Data persists across page refreshes (browser storage).
9. The layout works on mobile and desktop.

## Order lifecycle

```
Pending → Assigned → Accepted → Picked up → In transit → Delivered
                 (Cancelled is a separate final state)
```

| Status | Edit order | Assign / reassign rider | Cancel order |
| --- | --- | --- | --- |
| Pending | Yes | Yes | Yes |
| Assigned | Yes | Yes | Yes |
| Accepted | Yes | No | Yes |
| Picked up | No | No | Yes |
| In transit | No | No | Yes |
| Delivered | No | No | No |
| Cancelled | No | No | No |

## What is real and what is simulated

| Area | Reality |
| --- | --- |
| Login / registration | **Simulated.** Accounts and passwords are stored in plain text in the browser's `localStorage` and checked in the browser. This is **not secure authentication** — do not enter a real password. |
| Role access | Enforced in the frontend (route guards and data-layer checks). Anyone with access to the browser can edit stored data, so this is not server-side protection. |
| API | **Mock API.** `src/services/api.js` imitates a REST client with delay and optional failures, backed by `localStorage`. |
| Data | Seed/sample data plus whatever you create. It is per-browser; clearing site data resets it. |
| Real-time updates | **Simulated** with a timer (`src/services/realtime.js`), not WebSockets. |
| Route map, rider location, ETA | **Simulated** from the order's status — no map or GPS provider. |
| Notifications | In-app only. No push, email, or SMS. |
| Payments | None. "Payment method" on an order is a label only. |

## Technology stack

React 19 · React Router (HashRouter) · Context API · Vite · plain CSS (no UI
framework) · `localStorage` via a mock API service layer.

## Project structure

```
zyroo-local-delivery/
├── public/
├── screenshots/        final screenshots used below
├── src/
│   ├── components/     Navbar, Footer, Icon, Loader, Spinner, StatusBadge,
│   │                   PriorityBadge, DeliveryTimeline, DeliveryMap,
│   │                   RiderInfoCard, NotificationBell, ConfirmDialog,
│   │                   EmptyState, ProtectedRoute
│   ├── layouts/        AppLayout
│   ├── pages/          auth/, business/, rider/, customer/,
│   │                   Home, Track, OrderDetails, NotFound
│   ├── context/        AuthContext, OrdersContext, NotificationsContext, ToastContext
│   ├── services/       api.js (mock API layer), realtime.js (simulated live updates)
│   ├── hooks/          useAsyncAction, useDebouncedValue, useMyNotifications
│   ├── data/           seed data and pure helpers (orders, users, notifications)
│   ├── utils/          datetime.js
│   ├── config/         env.js (reads environment variables in one place)
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

**Architecture in one paragraph:** pages and components never touch
`localStorage` directly. They call context functions; the contexts call
`services/api.js`; `api.js` is the only module that reads or writes storage.
Replacing `api.js` with real `fetch()` calls would not require changing the UI.

## Installation

Requires Node.js (current LTS) and npm.

```bash
npm install
cp .env.example .env     # optional
npm run dev              # development server
npm run build            # production build into dist/
npm run preview          # preview the production build
```

## Environment setup

All variables are optional; defaults work without a `.env` file. `.env` is
gitignored and `.env.example` documents every variable. There are no real
secrets in this project.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_DELAY_MS` | `350` | Simulated latency per mock API call |
| `VITE_API_FAILURE_RATE` | `0` | Chance (0–1) a call fails — try `0.15` to see error/retry states |
| `VITE_REALTIME_INTERVAL_MS` | `20000` | How often the simulator may advance a delivery; `0` disables it |

## API information

There is no live API. The mock layer in `src/services/api.js` exposes the
functions a REST client would: `login`, `getUsers`/`saveUsers`, `getOrders`,
`createOrder`, `updateOrder`, `assignRider`, `updateDeliveryStatus`,
`getNotifications`/`saveNotifications`. For testing error states you can run
`window.__forceApiFailure = true` in the browser console (it resets on reload).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Business | business@waypoint.demo | business123 |
| Rider | hamza@waypoint.demo | rider123 |
| Customer | ali@customer.demo | customer123 |

Three more demo riders exist in `src/data/users.js`, and new accounts can be
created from Sign up. These are sample credentials for a demo with no real
security.

## Demo walkthrough

1. Log in as **Business** → Dashboard.
2. **Create order** (optionally choose a rider) → open its details.
3. **Assign rider** → the Orders page confirms with a toast.
4. Log in as **Rider (Hamza)** → open the assigned delivery → **Accept** →
   **Mark as picked up** → **Start transit** → **Mark as delivered**.
5. Log in as **Customer (Ali)** → **My orders** → open an order to see the
   timeline and tracking panel; open the **bell** for notifications.
6. Back as Business: search, apply filters, **Clear filters**, use pagination.

## Screenshots

| | |
| --- | --- |
| **1. Login** ![Login](screenshots/1.Screenshot%202026-10-07%20192008.png) | **2. Register — role selection** ![Register](screenshots/2.Screenshot%202026-10-07%20192054.png) |
| **3. Sign-up validation (invalid email)** ![Validation](screenshots/3.Screenshot%202026-10-07%20192222.png) | **4. Unauthorized page (Customer opening a Business URL)** ![Unauthorized](screenshots/4.Screenshot%202026-10-07%20192332.png) |
| **5. Business dashboard** ![Dashboard](screenshots/5.Screenshot%202026-10-07%20192511.png) | **6. Orders list with pagination count** ![Orders](screenshots/6.Screenshot%202026-10-07%20192622.png) |
| **7. Combined filters with Clear filters** ![Filters](screenshots/7.Screenshot%202026-10-07%20192829.png) | **8. Empty search result** ![Empty](screenshots/8.Screenshot%202026-10-07%20192903.png) |
| **9. Pagination — page 2** ![Page 2](screenshots/9.Screenshot%202026-10-07%20192947.png) | **10. Create order form** ![Create order](screenshots/10.Screenshot%202026-10-07%20214608.png) |
| **11. Order details with delivery timeline** ![Order details](screenshots/11.Screenshot%202026-10-07%20214655.png) | **12. Rider assigned — success toast on Orders** ![Assigned](screenshots/12.Screenshot%202026-10-07%20214945.png) |
| **13. Rider dashboard** ![Rider](screenshots/13.Screenshot%202026-10-07%20215611.png) | **14. Customer — My orders** ![Customer orders](screenshots/14.Screenshot%202026-10-07%20215729.png) |
| **15. Customer — order tracking** ![Tracking](screenshots/15.Screenshot%202026-10-07%20215815.png) | **16. Notifications dropdown** ![Notifications](screenshots/16.Screenshot%202026-10-07%20215905.png) |

## Testing

There is **no automated test suite** in this repository. Testing is a manual
checklist; each item has an expected result.

| Area | Scenario | Expected result |
| --- | --- | --- |
| Auth | Sign up with an invalid email / short password | Clear error, nothing created |
| Auth | Log in with a wrong password | "Email or password is incorrect" |
| Auth | Refresh while logged in; then log out and refresh | Stays logged in; then stays logged out |
| Roles | Customer opens a Business URL | Unauthorized page |
| Orders | Create with invalid phone, or pickup = delivery | Blocked with a clear message |
| Orders | Edit / reassign / cancel at each status | Matches the lifecycle table above |
| Delivery | Rider accepts → picked up → transit → delivered | Status and timeline update; customer sees it |
| Errors | Set `window.__forceApiFailure = true`, accept a delivery | Status rolls back with an error toast |
| Errors | Set `VITE_API_FAILURE_RATE=1`, reload | Error screen with Retry that recovers |
| Search | Search, combine filters, Clear filters, page through | Expected rows; page resets on change |
| Empty | Search for nonsense | "No orders match your filters" |
| Layout | Mobile, tablet, desktop widths; Chrome plus a second browser | Usable layout, no horizontal scroll |
| Console | Open DevTools while using the app | No critical errors |

## Known limitations & future improvements

- Not secure: simulated login, plain-text stored passwords, no server checks
- Data is per-browser; there is no shared multi-user data
- No real map/GPS; the route, rider position, and ETA are simulated
- No push, email, or SMS notifications; no payments
- Rider capacity/availability isn't modeled
- Next steps: a real backend with hashed credentials and server-side
  authorization, a database, real maps, and proof-of-delivery uploads

## Deployment

Waypoint is a static Vite build with no server requirements and uses
`HashRouter`, so deep links work without rewrite rules.

**Vercel or Netlify**
1. Import the GitHub repository.
2. Set the **root directory** to the folder containing `package.json`
   (the repo root — this project is not nested inside another folder).
3. Build command: `npm run build` · Output directory: `dist`.
4. Optionally add the `VITE_*` variables in the host's dashboard.
5. Open the live URL, log in as each role, and check the browser console.

Then put the live URL at the top of this README.
