/**
 * In-browser stand-in for the AYG FastAPI backend (routes under /api/v1).
 *
 * It mirrors the real contract: same paths, payloads, enum values, status codes and error
 * messages, plus the side effects the frontend relies on (a contract marks its studio "rented",
 * deleting a contract frees it, deleting a building removes its studios, ...).
 *
 * `createBackend(storage)` is pure JS with no browser globals, so it can be exercised from Node.
 * `storage` is { load(): object | null, save(object): void }.
 */

import { buildSeed, dec } from './seed.js';

export class HttpError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Request failed');
    this.status = status;
    this.detail = detail;
  }
}

const PART_STATUS = ['available', 'rented', 'upcoming_end'];
const BATHROOMS = ['private', 'shared'];
const FURNISHED = ['yes', 'no'];
const BALCONY = ['yes', 'shared', 'no'];
const ROLES = ['super_admin', 'studio_rental', 'apartment_sale'];
const SOURCES = ['facebook', 'instagram', 'google', 'Bayut', 'Aqar map', 'Dubizzle', 'referral', 'walk_in', 'other'];
const ENTITY_TYPES = ['part', 'rent', 'sale', 'rental_contract'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nowIso = () => new Date().toISOString();
const clone = (v) => JSON.parse(JSON.stringify(v));

const normalizePhone = (p) => String(p || '').replace(/[^0-9+]/g, '');
const phonesMatch = (a, b) => {
  const strip = (p) => normalizePhone(p).replace(/^\+?20/, '0');
  return strip(a) === strip(b);
};

// ---- validation helpers (mimic FastAPI / pydantic 422 responses) --------------------------------

const invalid = (errors) => {
  throw new HttpError(422, errors);
};

const missing = (field) => ({ type: 'missing', loc: ['body', field], msg: 'Field required' });
const bad = (field, msg) => ({ type: 'value_error', loc: ['body', field], msg });

function requireFields(body, fields) {
  const errors = fields
    .filter((f) => body[f] === undefined || body[f] === null || body[f] === '')
    .map(missing);
  if (errors.length) invalid(errors);
}

function checkEnum(errors, body, field, allowed) {
  if (body[field] !== undefined && body[field] !== null && !allowed.includes(body[field])) {
    errors.push(bad(field, `Input should be ${allowed.map((v) => `'${v}'`).join(', ')}`));
  }
}

function checkNumbers(errors, body, fields) {
  fields.forEach((f) => {
    if (body[f] === undefined || body[f] === null || body[f] === '') return;
    if (!Number.isFinite(Number(String(body[f]).replace(/,/g, '')))) {
      errors.push(bad(f, 'Input should be a valid number'));
    }
  });
}

function validateListing(body, { creating, kind }) {
  const required = ['name', 'location', 'address', 'area', 'number', 'price', 'bedrooms', 'bathrooms'];
  if (kind === 'rent') required.push('floor', 'total_parts');
  if (creating) requireFields(body, required);
  const errors = [];
  checkEnum(errors, body, 'bathrooms', BATHROOMS);
  checkNumbers(errors, body, ['area', 'price', 'bedrooms', 'floor', 'total_parts']);
  if (errors.length) invalid(errors);
}

function validatePart(body, { creating }) {
  if (creating) {
    requireFields(body, ['title', 'area', 'monthly_price', 'bedrooms', 'bathrooms', 'furnished', 'balcony']);
  }
  const errors = [];
  checkEnum(errors, body, 'bathrooms', BATHROOMS);
  checkEnum(errors, body, 'furnished', FURNISHED);
  checkEnum(errors, body, 'balcony', BALCONY);
  checkEnum(errors, body, 'status', PART_STATUS);
  checkNumbers(errors, body, ['area', 'monthly_price', 'bedrooms', 'floor']);
  if (errors.length) invalid(errors);
}

function validateContract(body, { creating }) {
  if (creating) {
    requireFields(body, [
      'apartment_part_id', 'customer_name', 'customer_phone', 'customer_id_number', 'how_did_customer_find_us',
      'paid_deposit', 'warrant_amount', 'rent_start_date', 'rent_end_date', 'rent_period', 'commission', 'rent_price',
    ]);
  }
  const errors = [];
  checkEnum(errors, body, 'how_did_customer_find_us', SOURCES);
  checkNumbers(errors, body, ['paid_deposit', 'warrant_amount', 'rent_period', 'commission', 'rent_price']);
  ['rent_start_date', 'rent_end_date'].forEach((f) => {
    if (body[f] && Number.isNaN(Date.parse(body[f]))) errors.push(bad(f, 'Input should be a valid date'));
  });
  if (errors.length) invalid(errors);
}

// Only copy fields the real schemas accept, normalising number fields the way pydantic would.
const pick = (body, fields) => {
  const out = {};
  fields.forEach((f) => {
    if (body[f] !== undefined) out[f] = body[f];
  });
  return out;
};

const DECIMALS = ['area', 'price', 'monthly_price', 'paid_deposit', 'warrant_amount', 'commission', 'rent_price'];
const INTEGERS = ['bedrooms', 'floor', 'total_parts', 'rent_period', 'apartment_part_id'];

function coerce(data) {
  DECIMALS.forEach((f) => {
    if (data[f] !== undefined && data[f] !== null) data[f] = dec(data[f]);
  });
  INTEGERS.forEach((f) => {
    if (data[f] !== undefined && data[f] !== null) data[f] = parseInt(data[f], 10);
  });
  return data;
}

const LISTING_FIELDS = ['name', 'location', 'address', 'area', 'number', 'price', 'bedrooms', 'bathrooms', 'description', 'photos_url', 'location_on_map', 'facilities_amenities'];
const RENT_FIELDS = [...LISTING_FIELDS, 'floor', 'total_parts'];
const PART_FIELDS = ['status', 'title', 'area', 'floor', 'monthly_price', 'bedrooms', 'bathrooms', 'furnished', 'balcony', 'description', 'photos_url'];
const CONTRACT_FIELDS = ['customer_name', 'customer_phone', 'customer_id_number', 'how_did_customer_find_us', 'paid_deposit', 'warrant_amount', 'rent_start_date', 'rent_end_date', 'rent_period', 'contract_url', 'customer_id_url', 'commission', 'rent_price', 'is_active'];

// ---- the backend ------------------------------------------------------------------------------

export function createBackend(storage) {
  let db = storage.load();
  if (!db || db.version !== 1) {
    db = buildSeed();
    storage.save(db);
  }

  const persist = () => {
    try {
      storage.save(db);
    } catch (error) {
      // Typically localStorage quota (many large uploaded photos). The session keeps working in memory.
      console.warn('[demo] could not persist demo data:', error?.message || error);
    }
  };

  const nextId = (kind) => {
    db.counters[kind] = (db.counters[kind] || 0) + 1;
    return db.counters[kind];
  };

  const publicAdmin = (a) => {
    const { password, ...rest } = a;
    return clone(rest);
  };

  const withParts = (apt) => ({
    ...clone(apt),
    apartment_parts: db.parts.filter((p) => p.apartment_id === apt.id).map(clone),
  });

  const page = (items, query) => {
    const skip = parseInt(query.skip, 10) || 0;
    const limit = parseInt(query.limit, 10) || 100;
    return items.slice(skip, skip + limit).map(clone);
  };

  const find = (list, id, label) => {
    const item = list.find((x) => x.id === parseInt(id, 10));
    if (!item) throw new HttpError(404, label);
    return item;
  };

  const canManage = (admin, ownerId) => admin.role === 'super_admin' || admin.id === ownerId;

  const requireOwner = (admin, ownerId, message) => {
    if (!canManage(admin, ownerId)) throw new HttpError(403, message);
  };

  const removeContractsForPart = (partId) => {
    db.contracts = db.contracts.filter((c) => c.apartment_part_id !== partId);
  };

  const removeRent = (apt) => {
    const partIds = db.parts.filter((p) => p.apartment_id === apt.id).map((p) => p.id);
    db.contracts = db.contracts.filter((c) => !partIds.includes(c.apartment_part_id));
    db.parts = db.parts.filter((p) => p.apartment_id !== apt.id);
    db.rent = db.rent.filter((a) => a.id !== apt.id);
  };

  // ---- route table ----
  const routes = [];
  const route = (method, pattern, auth, handler) => {
    const keys = [];
    const re = new RegExp(
      `^${pattern.replace(/:([a-z_]+)/g, (_, k) => {
        keys.push(k);
        return '([^/]+)';
      })}$`
    );
    routes.push({ method, re, keys, auth, handler });
  };

  // ---- auth ----
  route('POST', '/auth/login', null, ({ body }) => {
    const username = String(body.username || '').trim();
    const admin = db.admins.find(
      (a) => a.email.toLowerCase() === username.toLowerCase() || (username && phonesMatch(a.phone, username))
    );
    if (!admin || admin.password !== body.password) {
      throw new HttpError(401, 'Incorrect email/phone or password');
    }
    return { access_token: `demo-token.${admin.id}.${Date.now().toString(36)}`, token_type: 'bearer' };
  });

  route('POST', '/auth/register', 'super', ({ body }) => createAdmin(body));

  route('POST', '/auth/create-master-admin', null, () => {
    throw new HttpError(400, 'Master admin already exists. Use regular admin creation instead.');
  });

  // ---- admins ----
  function createAdmin(body) {
    requireFields(body, ['full_name', 'email', 'phone', 'role', 'password']);
    const errors = [];
    if (!EMAIL_RE.test(body.email)) errors.push(bad('email', 'value is not a valid email address'));
    checkEnum(errors, body, 'role', ROLES);
    if (body.role === 'super_admin') {
      errors.push(bad('role', 'Value error, Cannot create super admin through regular registration'));
    }
    if (errors.length) invalid(errors);
    if (db.admins.some((a) => a.email.toLowerCase() === body.email.toLowerCase())) {
      throw new HttpError(400, 'Email already registered');
    }
    if (db.admins.some((a) => phonesMatch(a.phone, body.phone))) {
      throw new HttpError(400, 'Phone number already registered');
    }
    const admin = {
      id: nextId('admin'),
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      password: body.password,
      created_at: nowIso(),
      updated_at: null,
    };
    db.admins.push(admin);
    persist();
    return publicAdmin(admin);
  }

  function updateAdmin(target, body, { allowRole }) {
    const errors = [];
    if (body.email !== undefined && !EMAIL_RE.test(body.email)) errors.push(bad('email', 'value is not a valid email address'));
    checkEnum(errors, body, 'role', ROLES);
    if (errors.length) invalid(errors);
    if (body.email && db.admins.some((a) => a.id !== target.id && a.email.toLowerCase() === body.email.toLowerCase())) {
      throw new HttpError(400, 'Email already registered');
    }
    if (body.phone && db.admins.some((a) => a.id !== target.id && phonesMatch(a.phone, body.phone))) {
      throw new HttpError(400, 'Phone number already registered');
    }
    ['full_name', 'email', 'phone'].forEach((f) => {
      if (body[f] !== undefined && body[f] !== null && body[f] !== '') target[f] = body[f];
    });
    if (allowRole && body.role) target.role = body.role;
    if (body.password) target.password = body.password;
    target.updated_at = nowIso();
    // Listings carry the owner's phone as their WhatsApp contact.
    db.rent.concat(db.sale).forEach((l) => {
      if (l.listed_by_admin_id === target.id) l.contact_number = target.phone;
    });
    persist();
    return publicAdmin(target);
  }

  route('GET', '/admins', 'super', ({ query }) => page(db.admins.map(publicAdmin), query));
  route('GET', '/admins/me', 'admin', ({ admin }) => publicAdmin(admin));
  route('PUT', '/admins/me', 'admin', ({ admin, body }) => updateAdmin(admin, body, { allowRole: admin.role === 'super_admin' }));
  route('POST', '/admins', 'super', ({ body }) => createAdmin(body));
  route('GET', '/admins/:id', 'super', ({ params }) => publicAdmin(find(db.admins, params.id, 'Admin not found')));
  route('PUT', '/admins/:id', 'super', ({ params, body }) => updateAdmin(find(db.admins, params.id, 'Admin not found'), body, { allowRole: true }));
  route('DELETE', '/admins/:id', 'super', ({ admin, params }) => {
    const target = find(db.admins, params.id, 'Admin not found');
    if (target.id === admin.id) throw new HttpError(400, 'Cannot delete your own account');
    db.rent.filter((a) => a.listed_by_admin_id === target.id).forEach(removeRent);
    db.sale = db.sale.filter((a) => a.listed_by_admin_id !== target.id);
    db.admins = db.admins.filter((a) => a.id !== target.id);
    persist();
    return publicAdmin(target);
  });

  // ---- sale apartments ----
  route('GET', '/apartments/sale', null, ({ query }) => page(db.sale, query));
  route('GET', '/apartments/sale/:id', null, ({ params }) => clone(find(db.sale, params.id, 'Apartment not found')));
  route('POST', '/apartments/sale', 'admin', ({ admin, body }) => {
    validateListing(body, { creating: true, kind: 'sale' });
    const apt = {
      id: nextId('sale'),
      ...coerce(pick(body, LISTING_FIELDS)),
      photos_url: body.photos_url || [],
      contact_number: admin.phone,
      listed_by_admin_id: admin.id,
      created_at: nowIso(),
      updated_at: null,
    };
    db.sale.push(apt);
    persist();
    return clone(apt);
  });
  route('PUT', '/apartments/sale/:id', 'admin', ({ admin, params, body }) => {
    const apt = find(db.sale, params.id, 'Apartment not found');
    requireOwner(admin, apt.listed_by_admin_id, 'Only the admin who created the apartment can update it');
    validateListing(body, { creating: false, kind: 'sale' });
    Object.assign(apt, coerce(pick(body, LISTING_FIELDS)), { updated_at: nowIso() });
    persist();
    return clone(apt);
  });
  route('DELETE', '/apartments/sale/:id', 'admin', ({ admin, params }) => {
    const apt = find(db.sale, params.id, 'Apartment not found');
    requireOwner(admin, apt.listed_by_admin_id, 'Only the admin who created the apartment can delete it');
    db.sale = db.sale.filter((a) => a.id !== apt.id);
    persist();
    return clone(apt);
  });

  // ---- rent apartments (buildings) ----
  route('GET', '/apartments/rent', null, ({ query }) => page(db.rent, query));
  route('GET', '/apartments/rent/:id', null, ({ params }) => withParts(find(db.rent, params.id, 'Apartment not found')));
  route('POST', '/apartments/rent', 'admin', ({ admin, body }) => {
    validateListing(body, { creating: true, kind: 'rent' });
    const apt = {
      id: nextId('rent'),
      ...coerce(pick(body, RENT_FIELDS)),
      photos_url: body.photos_url || [],
      contact_number: admin.phone,
      listed_by_admin_id: admin.id,
      created_at: nowIso(),
      updated_at: null,
    };
    db.rent.push(apt);
    persist();
    return clone(apt);
  });
  route('PUT', '/apartments/rent/:id', 'admin', ({ admin, params, body }) => {
    const apt = find(db.rent, params.id, 'Apartment not found');
    requireOwner(admin, apt.listed_by_admin_id, 'Only the admin who created the apartment can update it');
    validateListing(body, { creating: false, kind: 'rent' });
    const data = coerce(pick(body, RENT_FIELDS));
    Object.assign(apt, data, { updated_at: nowIso() });
    if (data.floor !== undefined) db.parts.forEach((p) => p.apartment_id === apt.id && (p.floor = data.floor));
    persist();
    return clone(apt);
  });
  route('DELETE', '/apartments/rent/:id', 'admin', ({ admin, params }) => {
    const apt = find(db.rent, params.id, 'Apartment not found');
    requireOwner(admin, apt.listed_by_admin_id, 'Only the admin who created the apartment can delete it');
    removeRent(apt);
    persist();
    return clone(apt);
  });
  route('GET', '/apartments/rent/:id/whatsapp', null, ({ params }) => {
    const apt = find(db.rent, params.id, 'Apartment not found');
    const owner = db.admins.find((a) => a.id === apt.listed_by_admin_id);
    if (!owner) throw new HttpError(500, 'No admin contact available');
    const message = `Hello! I'm interested in the apartment: ${apt.name} located at ${apt.location}. Could you please provide more information?`;
    const digits = owner.phone.replace(/[^0-9+]/g, '');
    return { whatsapp_url: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`, admin_phone: owner.phone, message };
  });

  // ---- studios (apartment parts) ----
  const partsOf = (apartmentId) => db.parts.filter((p) => p.apartment_id === apartmentId);

  function createPart(admin, apt, body) {
    requireOwner(admin, apt.listed_by_admin_id, 'Only the admin who created the apartment can create parts for it');
    validatePart(body, { creating: true });
    const part = {
      id: nextId('part'),
      apartment_id: apt.id,
      created_by_admin_id: admin.id,
      ...coerce(pick(body, PART_FIELDS)),
      status: body.status || 'available',
      photos_url: body.photos_url || [],
      floor: apt.floor,
      created_at: nowIso(),
      updated_at: null,
    };
    db.parts.push(part);
    persist();
    return clone(part);
  }

  function updatePart(admin, part, body) {
    const apt = db.rent.find((a) => a.id === part.apartment_id);
    requireOwner(admin, apt?.listed_by_admin_id, 'Only the admin who created the apartment can update its parts');
    validatePart(body, { creating: false });
    Object.assign(part, coerce(pick(body, PART_FIELDS)), { updated_at: nowIso() });
    persist();
    return clone(part);
  }

  function deletePart(admin, part) {
    const apt = db.rent.find((a) => a.id === part.apartment_id);
    requireOwner(admin, apt?.listed_by_admin_id, 'Only the admin who created the apartment can delete its parts');
    removeContractsForPart(part.id);
    db.parts = db.parts.filter((p) => p.id !== part.id);
    persist();
    return clone(part);
  }

  const partOf = (apartmentId, partId) => {
    const apt = find(db.rent, apartmentId, 'Apartment not found');
    const part = find(db.parts, partId, 'Apartment part not found');
    if (part.apartment_id !== apt.id) throw new HttpError(404, 'Apartment part not found');
    return part;
  };

  route('GET', '/apartments/rent/:id/parts', null, ({ params, query }) => {
    find(db.rent, params.id, 'Apartment not found');
    return page(partsOf(parseInt(params.id, 10)), query);
  });
  route('POST', '/apartments/rent/:id/parts', 'admin', ({ admin, params, body }) =>
    createPart(admin, find(db.rent, params.id, 'Apartment not found'), body)
  );
  route('PUT', '/apartments/rent/:id/parts/:part_id', 'admin', ({ admin, params, body }) =>
    updatePart(admin, partOf(params.id, params.part_id), body)
  );
  route('DELETE', '/apartments/rent/:id/parts/:part_id', 'admin', ({ admin, params }) =>
    deletePart(admin, partOf(params.id, params.part_id))
  );

  route('GET', '/apartments/parts', null, ({ query }) => {
    let items = db.parts;
    if (query.status) items = items.filter((p) => p.status === query.status);
    return page(items, query);
  });
  route('GET', '/apartments/parts/:id', null, ({ params }) => clone(find(db.parts, params.id, 'Apartment part not found')));
  route('PUT', '/apartments/parts/:id', 'admin', ({ admin, params, body }) =>
    updatePart(admin, find(db.parts, params.id, 'Apartment part not found'), body)
  );
  route('DELETE', '/apartments/parts/:id', 'admin', ({ admin, params }) =>
    deletePart(admin, find(db.parts, params.id, 'Apartment part not found'))
  );

  route('GET', '/apartments/my-content', 'admin', ({ admin, query }) => {
    const mine = (l) => admin.role === 'super_admin' || l.listed_by_admin_id === admin.id;
    const rent = page(db.rent.filter(mine), query).map((a) => withParts(a));
    const sale = page(db.sale.filter(mine), query);
    return {
      rent_apartments: rent,
      sale_apartments: sale,
      total_rent_apartments: rent.length,
      total_sale_apartments: sale.length,
      total_studios: rent.reduce((n, a) => n + a.apartment_parts.length, 0),
    };
  });

  // ---- rental contracts ----
  const listContracts = ({ query }) => {
    let items = db.contracts;
    if (query.apartment_id) {
      const ids = partsOf(parseInt(query.apartment_id, 10)).map((p) => p.id);
      items = items.filter((c) => ids.includes(c.apartment_part_id));
    }
    if (query.is_active !== undefined && query.is_active !== '') {
      items = items.filter((c) => c.is_active === (query.is_active === 'true'));
    }
    return items;
  };

  route('GET', '/rental-contracts', 'admin', (ctx) => page(listContracts(ctx), ctx.query));
  route('GET', '/rental-contracts/by-studio', 'admin', (ctx) =>
    page([...listContracts(ctx)].sort((a, b) => b.id - a.id), ctx.query)
  );
  route('GET', '/rental-contracts/:id', 'admin', ({ params }) => clone(find(db.contracts, params.id, 'Rental contract not found')));
  route('POST', '/rental-contracts', 'admin', ({ admin, body }) => {
    validateContract(body, { creating: true });
    const part = db.parts.find((p) => p.id === parseInt(body.apartment_part_id, 10));
    if (!part) throw new HttpError(404, 'Apartment part not found');
    const apt = db.rent.find((a) => a.id === part.apartment_id);
    if (!canManage(admin, apt?.listed_by_admin_id)) {
      throw new HttpError(403, 'Only the admin who created the apartment can create contracts for its studios');
    }
    if (db.contracts.some((c) => c.apartment_part_id === part.id)) {
      throw new HttpError(400, 'A rental contract already exists for this studio');
    }
    const contract = {
      id: nextId('contract'),
      ...coerce(pick(body, [...CONTRACT_FIELDS, 'apartment_part_id'])),
      contract_url: body.contract_url || null,
      customer_id_url: body.customer_id_url || null,
      is_active: true,
      created_by_admin_id: admin.id,
      created_at: nowIso(),
      updated_at: null,
    };
    db.contracts.push(contract);
    part.status = 'rented';
    persist();
    return clone(contract);
  });
  route('PUT', '/rental-contracts/:id', 'admin', ({ params, body }) => {
    const contract = find(db.contracts, params.id, 'Rental contract not found');
    validateContract(body, { creating: false });
    Object.assign(contract, coerce(pick(body, CONTRACT_FIELDS)), { updated_at: nowIso() });
    persist();
    return clone(contract);
  });
  route('DELETE', '/rental-contracts/:id', 'admin', ({ params }) => {
    const contract = find(db.contracts, params.id, 'Rental contract not found');
    const part = db.parts.find((p) => p.id === contract.apartment_part_id);
    if (part) part.status = 'available';
    db.contracts = db.contracts.filter((c) => c.id !== contract.id);
    persist();
    return clone(contract);
  });

  // ---- uploads ----
  // `body.files` is a list of { name, url }: the interceptor has already turned the multipart upload
  // into URLs (downscaled data: URLs for images, a stock sample for PDFs / scans).
  const uploadTarget = (admin, entityType, entityId) => {
    if (!ENTITY_TYPES.includes(entityType)) {
      throw new HttpError(400, `Invalid entity_type '${entityType}'. Must be one of: ${ENTITY_TYPES.join(', ')}`);
    }
    const id = parseInt(entityId, 10);
    const list = { part: db.parts, rent: db.rent, sale: db.sale, rental_contract: db.contracts }[entityType];
    const label = { part: 'Apartment part', rent: 'Apartment', sale: 'Apartment', rental_contract: 'Rental contract' }[entityType];
    const item = find(list, id, `${label} not found`);
    const ownerId = entityType === 'part' || entityType === 'rental_contract' ? item.created_by_admin_id : item.listed_by_admin_id;
    requireOwner(admin, ownerId, 'You can only modify files of items you created');
    return { item, id };
  };

  const documentField = (entityType, documentType) => {
    if (entityType !== 'rental_contract') return null;
    if (!['contract', 'customer_id'].includes(documentType)) {
      throw new HttpError(400, "document_type must be 'contract' or 'customer_id' for rental_contract");
    }
    return documentType === 'contract' ? 'contract_url' : 'customer_id_url';
  };

  route('POST', '/uploads/photos', 'admin', ({ admin, body }) => {
    const entityType = String(body.entity_type || '');
    const { item, id } = uploadTarget(admin, entityType, body.entity_id);
    const field = documentField(entityType, body.document_type);
    const files = (body.files || []).filter((f) => f && f.url);
    if (!files.length) throw new HttpError(400, 'No valid files provided');

    const saved = files.map((f, i) => ({ key: `${entityType}/${id}/${Date.now()}-${i}-${f.name}`, url: f.url }));
    const response = {
      entity_id: id,
      entity_type: entityType,
      count: saved.length,
      files: saved,
      folder_key: `${entityType}/${id}/`,
      saved_to_db: true,
    };

    if (field) {
      item[field] = saved[0].url;
      response.document_type = body.document_type;
      response.url_field_updated = body.document_type;
      response.url_saved = saved[0].url;
    } else {
      item.photos_url = [...new Set([...(item.photos_url || []), ...saved.map((s) => s.url)])];
    }
    persist();
    return response;
  });

  route('DELETE', '/uploads/photos', 'admin', ({ admin, query }) => {
    const entityType = String(query.entity_type || '');
    const { item, id } = uploadTarget(admin, entityType, query.entity_id);
    const field = documentField(entityType, query.document_type);
    let removed;
    if (field) {
      removed = item[field];
      if (!removed) throw new HttpError(404, 'No document stored for this field');
      item[field] = null;
    } else {
      if (!query.url) throw new HttpError(400, 'url is required');
      if (!(item.photos_url || []).includes(query.url)) throw new HttpError(404, 'Photo not found on this item');
      removed = query.url;
      item.photos_url = item.photos_url.filter((u) => u !== query.url);
    }
    persist();
    return { entity_id: id, entity_type: entityType, deleted: removed };
  });

  route('GET', '/uploads/signed-url', 'admin', ({ query }) => ({
    url: query.url,
    expires_in: parseInt(query.expires_in, 10) || 900,
  }));

  // ---- dispatcher ----
  const adminFromToken = (token) => {
    const match = /^demo-token\.(\d+)\./.exec(token || '');
    return match ? db.admins.find((a) => a.id === parseInt(match[1], 10)) || null : null;
  };

  /**
   * @param {{ method: string, path: string, query?: object, body?: object, token?: string|null }} request
   *        `path` is relative to /api/v1, e.g. "/apartments/rent/3".
   * @returns {{ status: number, data: any }}
   */
  function handle({ method, path, query = {}, body = {}, token = null }) {
    const clean = path.replace(/\/+$/, '') || '/';
    try {
      for (const r of routes) {
        if (r.method !== method) continue;
        const m = r.re.exec(clean);
        if (!m) continue;
        const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
        let admin = null;
        if (r.auth) {
          admin = adminFromToken(token);
          if (!admin) throw new HttpError(401, 'Could not validate credentials');
          if (r.auth === 'super' && admin.role !== 'super_admin') throw new HttpError(403, 'Not enough permissions');
        }
        return { status: 200, data: r.handler({ params, query, body, admin }) };
      }
      const pathExists = routes.some((r) => r.re.test(clean));
      throw new HttpError(pathExists ? 405 : 404, pathExists ? 'Method Not Allowed' : 'Not Found');
    } catch (error) {
      if (error instanceof HttpError) return { status: error.status, data: { detail: error.detail } };
      console.error('[demo] mock backend error:', error);
      return { status: 500, data: { detail: 'Internal Server Error' } };
    }
  }

  return {
    handle,
    reset() {
      db = buildSeed();
      persist();
    },
  };
}
