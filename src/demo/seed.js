/**
 * Sample data for the demo backend. Everything is fictional.
 * Dates are relative to "now" so rental alerts always show a spread of urgencies
 * (overdue / critical / warning / info / healthy), no matter when the demo is opened.
 */

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './config.js';

const PHOTO = (name) => `/demo-photos/${name}.svg`;
const CONTRACT_DOC = '/demo-docs/sample-contract.pdf';

// Decimal fields come back from the real API as fixed-point strings ("4500.00").
export const dec = (value) => {
  const n = Number(String(value ?? 0).replace(/[^0-9.-]/g, ''));
  return (Number.isFinite(n) ? n : 0).toFixed(2);
};

const iso = (daysFromNow) => new Date(Date.now() + daysFromNow * 86400000).toISOString();

const dateOnly = (daysFromNow) => {
  const d = new Date(Date.now() + daysFromNow * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const MAP = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export function buildSeed() {
  const admins = DEMO_ACCOUNTS.map((a, i) => ({
    id: i + 1,
    full_name: a.full_name,
    email: a.email,
    phone: a.phone,
    role: a.apiRole,
    password: DEMO_PASSWORD,
    created_at: iso(-120 + i * 9),
    updated_at: null,
  }));
  const phoneOf = (adminId) => admins.find((a) => a.id === adminId).phone;

  // ---- Rental buildings -------------------------------------------------------------------
  const rentDefs = [
    {
      owner: 2, name: 'Maadi Residence A', location: 'Maadi', address: 'Road 9, Maadi, Cairo', area: 210,
      number: '12', price: 18000, bedrooms: 4, floor: 3, total_parts: 4, daysAgo: 80,
      description: 'A quiet, well-kept building a short walk from Road 9, with fully furnished studios and 24/7 security.',
      facilities: '24/7 Security, Elevator, Parking, High-speed Internet, Cleaning Service',
      photos: ['exterior', 'entrance', 'floor-plan'],
    },
    {
      owner: 2, name: 'Maadi Garden Building', location: 'Maadi', address: 'Street 233, Degla, Maadi, Cairo', area: 180,
      number: '4', price: 14500, bedrooms: 3, floor: 2, total_parts: 3, daysAgo: 62,
      description: 'Garden-facing building in Degla with bright studios, a shared courtyard and nearby cafes.',
      facilities: 'Garden View, Elevator, Security, Central A/C',
      photos: ['exterior', 'balcony', 'entrance'],
    },
    {
      owner: 4, name: 'Mokattam View Tower', location: 'Mokattam', address: 'Street 9, Mokattam, Cairo', area: 195,
      number: '27', price: 11800, bedrooms: 4, floor: 5, total_parts: 4, daysAgo: 45,
      description: 'High-floor studios with open city views, close to the main road and public transport.',
      facilities: 'City View, Elevator, Parking, Security',
      photos: ['exterior', 'balcony', 'floor-plan'],
    },
    {
      owner: 1, name: 'Maadi Corniche Residence', location: 'Maadi', address: 'Corniche El Nil, Maadi, Cairo', area: 240,
      number: '1', price: 24000, bedrooms: 3, floor: 8, total_parts: 3, daysAgo: 30,
      description: 'Premium riverside building with spacious studios, a gym and concierge desk.',
      facilities: 'Nile View, Gym, Concierge, Elevator, Parking, 24/7 Security',
      photos: ['exterior', 'balcony', 'entrance'],
    },
  ];

  const rent = rentDefs.map((d, i) => ({
    id: i + 1,
    name: d.name,
    location: d.location,
    address: d.address,
    area: dec(d.area),
    number: d.number,
    price: dec(d.price),
    bedrooms: d.bedrooms,
    bathrooms: 'private',
    description: d.description,
    photos_url: d.photos.map(PHOTO),
    location_on_map: MAP(d.address),
    facilities_amenities: d.facilities,
    floor: d.floor,
    total_parts: d.total_parts,
    contact_number: phoneOf(d.owner),
    listed_by_admin_id: d.owner,
    created_at: iso(-d.daysAgo),
    updated_at: null,
  }));

  // ---- Studios (apartment parts) ---------------------------------------------------------
  // contractEnds: days from today until the rental contract ends (only for rented / upcoming_end).
  const partDefs = [
    // Maadi Residence A (apartment 1)
    { apt: 1, title: 'Studio 301', area: 38, price: 4500, beds: 1, bath: 'private', furn: 'yes', balc: 'yes', status: 'available', photos: ['living-area', 'bedroom', 'kitchen', 'bathroom'] },
    { apt: 1, title: 'Studio 302', area: 42, price: 5200, beds: 1, bath: 'private', furn: 'yes', balc: 'shared', status: 'rented', contractEnds: 200, photos: ['living-area', 'bedroom', 'balcony'] },
    { apt: 1, title: 'Studio 303', area: 35, price: 4000, beds: 1, bath: 'shared', furn: 'no', balc: 'no', status: 'available', photos: ['living-area', 'kitchen'] },
    { apt: 1, title: 'Studio 304', area: 45, price: 5500, beds: 1, bath: 'private', furn: 'yes', balc: 'yes', status: 'upcoming_end', contractEnds: 18, photos: ['bedroom', 'living-area', 'bathroom', 'balcony'] },
    // Maadi Garden Building (apartment 2)
    { apt: 2, title: 'Studio 201', area: 40, price: 4800, beds: 1, bath: 'private', furn: 'yes', balc: 'yes', status: 'available', photos: ['balcony', 'living-area', 'bedroom'] },
    { apt: 2, title: 'Studio 202', area: 33, price: 3800, beds: 1, bath: 'shared', furn: 'yes', balc: 'no', status: 'rented', contractEnds: 45, photos: ['living-area', 'kitchen'] },
    { apt: 2, title: 'Studio 203', area: 48, price: 6200, beds: 2, bath: 'private', furn: 'yes', balc: 'yes', status: 'available', photos: ['living-area', 'bedroom', 'kitchen', 'balcony'] },
    // Mokattam View Tower (apartment 3)
    { apt: 3, title: 'Studio 501', area: 30, price: 3200, beds: 1, bath: 'shared', furn: 'no', balc: 'yes', status: 'available', photos: ['living-area', 'balcony'] },
    { apt: 3, title: 'Studio 502', area: 36, price: 3600, beds: 1, bath: 'private', furn: 'yes', balc: 'shared', status: 'rented', contractEnds: -5, photos: ['bedroom', 'living-area', 'bathroom'] },
    { apt: 3, title: 'Studio 503', area: 41, price: 4100, beds: 1, bath: 'private', furn: 'yes', balc: 'yes', status: 'upcoming_end', contractEnds: 3, photos: ['living-area', 'kitchen', 'balcony'] },
    { apt: 3, title: 'Studio 504', area: 44, price: 4500, beds: 1, bath: 'private', furn: 'no', balc: 'yes', status: 'available', photos: ['bedroom', 'living-area', 'kitchen'] },
    // Maadi Corniche Residence (apartment 4)
    { apt: 4, title: 'Studio 801', area: 52, price: 7500, beds: 1, bath: 'private', furn: 'yes', balc: 'yes', status: 'rented', contractEnds: 300, photos: ['living-area', 'bedroom', 'balcony', 'bathroom'] },
    { apt: 4, title: 'Studio 802', area: 50, price: 7200, beds: 1, bath: 'private', furn: 'yes', balc: 'yes', status: 'available', photos: ['balcony', 'living-area', 'kitchen'] },
    { apt: 4, title: 'Studio 803', area: 47, price: 6800, beds: 1, bath: 'private', furn: 'yes', balc: 'shared', status: 'available', photos: ['living-area', 'bedroom'] },
  ];

  const descriptions = [
    'Bright, fully equipped studio with modern finishes and plenty of natural light.',
    'Comfortable studio with a smart layout, ideal for professionals or a small family.',
    'Quiet unit with a separate kitchenette and generous storage.',
  ];

  const parts = partDefs.map((d, i) => ({
    id: i + 1,
    apartment_id: d.apt,
    created_by_admin_id: rent[d.apt - 1].listed_by_admin_id,
    status: d.status,
    title: d.title,
    area: dec(d.area),
    floor: rent[d.apt - 1].floor,
    monthly_price: dec(d.price),
    bedrooms: d.beds,
    bathrooms: d.bath,
    furnished: d.furn,
    balcony: d.balc,
    description: descriptions[i % descriptions.length],
    photos_url: d.photos.map(PHOTO),
    created_at: iso(-(rentDefs[d.apt - 1].daysAgo - 2)),
    updated_at: null,
  }));

  // ---- Rental contracts (one per rented / upcoming_end studio) ----------------------------
  const tenants = [
    ['Layla Samir', 'facebook'],
    ['Youssef Nabil', 'Bayut'],
    ['Nour Adel', 'referral'],
    ['Hany Fathy', 'Dubizzle'],
    ['Rana Tarek', 'instagram'],
    ['Mostafa Salem', 'google'],
  ];

  const contracts = [];
  partDefs.forEach((d, i) => {
    if (d.contractEnds === undefined) return;
    const n = contracts.length;
    const [name, source] = tenants[n % tenants.length];
    const periodMonths = 12;
    const endsIn = d.contractEnds;
    const price = d.price;
    contracts.push({
      id: n + 1,
      apartment_part_id: i + 1,
      customer_name: name,
      customer_phone: `0100000${String(10 + n).padStart(4, '0')}`,
      customer_id_number: `2990101010${String(1000 + n)}`.slice(0, 14),
      how_did_customer_find_us: source,
      paid_deposit: dec(price),
      warrant_amount: dec(price),
      rent_start_date: dateOnly(endsIn - periodMonths * 30),
      rent_end_date: dateOnly(endsIn),
      rent_period: periodMonths,
      contract_url: CONTRACT_DOC,
      customer_id_url: CONTRACT_DOC,
      commission: dec(price * 0.5),
      rent_price: dec(price),
      is_active: true,
      created_by_admin_id: rent[d.apt - 1].listed_by_admin_id,
      created_at: iso(endsIn - periodMonths * 30),
      updated_at: null,
    });
  });

  // ---- Apartments for sale ---------------------------------------------------------------
  const saleDefs = [
    { owner: 3, name: 'Spacious 3-Bedroom in Degla', location: 'Maadi', address: 'Street 82, Degla, Maadi, Cairo', area: 165, number: '7B', price: 5200000, beds: 3, bath: 'private', days: 70, facilities: 'Elevator, Parking, Garden View, 24/7 Security', photos: ['exterior', 'living-area', 'bedroom', 'kitchen', 'bathroom'], desc: 'A bright corner apartment on a quiet street, finished to a high standard with a large reception and a private balcony.' },
    { owner: 3, name: 'Modern 2-Bedroom Apartment', location: 'Maadi', address: 'Road 256, Maadi, Cairo', area: 105, number: '3A', price: 3100000, beds: 2, bath: 'private', days: 55, facilities: 'Elevator, Security, Built-in Wardrobes', photos: ['living-area', 'bedroom', 'kitchen', 'floor-plan'], desc: 'Compact, efficient layout in a well-run building. Ready to move in, close to schools and metro.' },
    { owner: 1, name: 'Panoramic View Penthouse', location: 'Mokattam', address: 'Street 9, Mokattam, Cairo', area: 240, number: 'PH1', price: 7800000, beds: 4, bath: 'private', days: 40, facilities: 'Private Terrace, City View, Elevator, Parking, Maid Room', photos: ['exterior', 'balcony', 'living-area', 'bedroom', 'kitchen', 'bathroom'], desc: 'Top-floor penthouse with a wraparound terrace and open views over the city skyline.' },
    { owner: 3, name: 'Cozy Family Apartment', location: 'Mokattam', address: 'Street 12, Mokattam, Cairo', area: 95, number: '5C', price: 2650000, beds: 2, bath: 'shared', days: 33, facilities: 'Elevator, Parking', photos: ['living-area', 'bedroom', 'kitchen'], desc: 'A practical family home in a calm residential block with easy access to the ring road.' },
    { owner: 3, name: 'Brand-new Ready-to-move Flat', location: 'Maadi', address: 'Road 9, Maadi, Cairo', area: 140, number: '9D', price: 4350000, beds: 3, bath: 'private', days: 20, facilities: 'Elevator, Parking, Security, Smart Home Prewiring', photos: ['exterior', 'living-area', 'kitchen', 'bedroom'], desc: 'Never lived in. Modern kitchen, spacious master suite and a quiet courtyard view.' },
    { owner: 3, name: 'Garden Floor with Private Entrance', location: 'Maadi', address: 'Street 233, Degla, Maadi, Cairo', area: 190, number: 'G1', price: 6100000, beds: 3, bath: 'private', days: 9, facilities: 'Private Garden, Private Entrance, Parking, Security', photos: ['exterior', 'balcony', 'living-area', 'bedroom', 'bathroom'], desc: 'Ground-floor apartment with its own garden, ideal for families who want outdoor space.' },
  ];

  const sale = saleDefs.map((d, i) => ({
    id: i + 1,
    name: d.name,
    location: d.location,
    address: d.address,
    area: dec(d.area),
    number: d.number,
    price: dec(d.price),
    bedrooms: d.beds,
    bathrooms: d.bath,
    description: d.desc,
    photos_url: d.photos.map(PHOTO),
    location_on_map: MAP(d.address),
    facilities_amenities: d.facilities,
    contact_number: phoneOf(d.owner),
    listed_by_admin_id: d.owner,
    created_at: iso(-d.days),
    updated_at: null,
  }));

  return {
    version: 1,
    counters: {
      admin: admins.length,
      rent: rent.length,
      sale: sale.length,
      part: parts.length,
      contract: contracts.length,
    },
    admins,
    rent,
    sale,
    parts,
    contracts,
  };
}
