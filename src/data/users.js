export const ROLES = {
  BUSINESS: "business",
  RIDER: "rider",
  CUSTOMER: "customer",
};

export const ROLE_LABELS = {
  [ROLES.BUSINESS]: "Business",
  [ROLES.RIDER]: "Rider",
  [ROLES.CUSTOMER]: "Customer",
};

export const seedUsers = [
  {
    id: "biz-1",
    name: "Waypoint Traders",
    email: "business@waypoint.demo",
    password: "business123",
    role: ROLES.BUSINESS,
  },
  {
    id: "rider-1",
    name: "Hamza",
    email: "hamza@waypoint.demo",
    password: "rider123",
    role: ROLES.RIDER,
  },
  {
    id: "rider-2",
    name: "Bilal",
    email: "bilal@waypoint.demo",
    password: "rider123",
    role: ROLES.RIDER,
  },
  {
    id: "rider-3",
    name: "Faizan",
    email: "faizan@waypoint.demo",
    password: "rider123",
    role: ROLES.RIDER,
  },
  {
    id: "rider-4",
    name: "Usman",
    email: "usman@waypoint.demo",
    password: "rider123",
    role: ROLES.RIDER,
  },
  {
    id: "cust-1",
    name: "Ali Khan",
    email: "ali@customer.demo",
    password: "customer123",
    role: ROLES.CUSTOMER,
  },
];

export const ROLE_HOME = {
  [ROLES.BUSINESS]: "/business/dashboard",
  [ROLES.RIDER]: "/rider/dashboard",
  [ROLES.CUSTOMER]: "/customer/orders",
};

export const DEMO_ACCOUNTS = [
  { role: ROLES.BUSINESS, email: "business@waypoint.demo", password: "business123" },
  { role: ROLES.RIDER, email: "hamza@waypoint.demo", password: "rider123" },
  { role: ROLES.CUSTOMER, email: "ali@customer.demo", password: "customer123" },
];
