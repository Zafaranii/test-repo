# AYG Real Estate: Frontend Demo

A client-presentation build of the AYG frontend (React 19 + Vite, with an Express SSR server).
It runs **without a backend**: every `/api/v1` request is answered in the browser from sample data, so every
screen is fully clickable, including adding, editing and deleting listings and uploading photos.

All names, phone numbers, prices and photos are made up. The only real asset is the AYG logo and the
landing-page hero photo.

## Run it

```bash
npm ci
npm run dev        # http://localhost:3000, with hot reload
```

Production-style:

```bash
npm run build
npm start          # http://localhost:3000
```

**Vercel / any static host:** the demo needs no server. `vercel.json` builds with `npm run build:static` and serves
`dist/client` with every unknown path rewritten to `index.html`, so links like `/studios` work on refresh.
Import the repo in Vercel and deploy with the defaults from `vercel.json`.

Or with Docker: `docker build -t ayg-demo . && docker run -p 3000:3000 ayg-demo`.
The demo build asks search engines not to index it (`robots.txt` and a `noindex` meta tag).

## Sample accounts

Password for every account: `Demo@1234`

| Role | Email (or phone) | Sign in at | Sees |
| --- | --- | --- | --- |
| Master admin | `master@ayg-demo.com` (`01000000001`) | `/master-admin/login` | Everything, all admins, rental alerts |
| Studio rental admin | `rental@ayg-demo.com` (`01000000002`) | `/admin/login` | Own buildings, studios, tenants |
| Apartment sales admin | `sales@ayg-demo.com` (`01000000003`) | `/admin/login` | Own apartments for sale |
| Second rental admin | `rental2@ayg-demo.com` (`01000000004`) | `/admin/login` | Shows that admins only see their own data |

The customer-facing site (`/`, `/studios`, `/buy-apartments`) needs no sign-in.

A small **"Demo · sample data"** pill at the bottom-left of every page opens a panel with these logins,
quick links, and a **Reset demo data** button.

## What the demo data contains

- 4 rental buildings with 14 studios (8 available, 4 rented, 2 ending soon) and 6 apartments for sale.
- 6 rental contracts with end dates relative to today, so **Rental Alerts** always shows one overdue,
  one critical, one warning and one upcoming contract.
- Photos are placeholder images in `public/demo-photos/`. Contract and ID scans point to
  `public/demo-docs/sample-contract.pdf`.
- Changes you make are stored in the browser's `localStorage` and survive a refresh. "Reset demo data"
  (or clearing site data) restores the original set. Photos you upload are shrunk and stored in the browser too,
  so a handful is fine but dozens may fill the browser's storage.

## Where to change things

| What | File |
| --- | --- |
| Owner name/photo, footer phone, WhatsApp, Facebook, map link, office hours and address | `src/config/siteConfig.js` |
| Sample listings, tenants, admins | `src/demo/seed.js` |
| Sample logins and password | `src/demo/config.js` |
| Placeholder photos | `public/demo-photos/*.svg`, `public/owner-placeholder.svg` |
| Landing page hero photo and logo | `src/assets/images/` |

## How the demo works

`src/demo/installMockApi.js` replaces `window.fetch` for `/api/v1/*` and sends those requests to
`src/demo/mockBackend.js`, a small in-browser copy of the real FastAPI backend: same routes, field names, enum
values, status codes and error messages, plus the side effects the UI relies on (creating a contract marks the
studio rented, deleting one frees it, deleting a building removes its studios, owner-only permissions, and so on).
Nothing else in the app was changed to support it, so the screens behave as they will with the real API.

## Switching to the real backend later

1. Build with `VITE_DEMO_MODE=false` (see `.env.example`) and set `API_PROXY_TARGET` to the backend.
2. Optionally delete `src/demo/`, the `DemoBanner` in `src/App.jsx`, the `installMockApi` call in
   `src/entry-client.jsx`, and `public/demo-photos`, `public/demo-docs`.
3. Replace the placeholder values in `src/config/siteConfig.js` and restore the real `public/robots.txt`.

## Not wired up in the original app

`/master-admin/reports`, `/master-admin/manage-admins` and `/master-admin/profile` exist as routes but nothing in the
app links to them (admin management lives inside the master dashboard), and the reports page does not load data.
They are left as they were.
