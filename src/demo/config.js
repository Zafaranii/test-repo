/**
 * Demo mode configuration.
 *
 * In demo mode the app never talks to a real backend: src/demo/installMockApi.js intercepts every
 * /api/v1 request and answers it from sample data kept in the browser (localStorage).
 * Set VITE_DEMO_MODE=false at build time to switch the mock off and use a real backend again.
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export const API_PREFIX = '/api/v1';
export const DB_STORAGE_KEY = 'ayg_demo_db_v1';

// Sample accounts. These are seeded into the mock database and listed in the on-screen demo panel.
export const DEMO_PASSWORD = 'Demo@1234';

export const DEMO_ACCOUNTS = [
  {
    key: 'master',
    role: 'Master admin',
    description: 'Sees everything: all listings, admins, reports and rental alerts.',
    full_name: 'Demo Master Admin',
    email: 'master@ayg-demo.com',
    phone: '01000000001',
    apiRole: 'super_admin',
    loginPath: '/master-admin/login',
  },
  {
    key: 'rental',
    role: 'Studio rental admin',
    description: 'Manages their own rental buildings, studios, tenants and contracts.',
    full_name: 'Sample Rental Admin',
    email: 'rental@ayg-demo.com',
    phone: '01000000002',
    apiRole: 'studio_rental',
    loginPath: '/admin/login',
  },
  {
    key: 'sales',
    role: 'Apartment sales admin',
    description: 'Manages their own apartments for sale.',
    full_name: 'Sample Sales Admin',
    email: 'sales@ayg-demo.com',
    phone: '01000000003',
    apiRole: 'apartment_sale',
    loginPath: '/admin/login',
  },
  {
    key: 'rental2',
    role: 'Second rental admin',
    description: 'Another rental admin, to show that each admin only sees their own data.',
    full_name: 'Second Rental Admin',
    email: 'rental2@ayg-demo.com',
    phone: '01000000004',
    apiRole: 'studio_rental',
    loginPath: '/admin/login',
  },
];
