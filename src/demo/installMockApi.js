/**
 * Routes every /api/v1 request to the in-browser mock backend instead of the network.
 * Demo data lives in localStorage, so edits survive a page refresh until "Reset demo data" is used.
 */

import { API_PREFIX, DB_STORAGE_KEY } from './config.js';
import { createBackend } from './mockBackend.js';

const SAMPLE_DOCUMENT = '/demo-docs/sample-contract.pdf';
const MAX_IMAGE_EDGE = 1280;
const JPEG_QUALITY = 0.78;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const localStorageAdapter = {
  load() {
    try {
      const raw = window.localStorage.getItem(DB_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(db) {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  },
};

// Uploaded photos are shrunk before being kept as data: URLs so a handful fit in localStorage.
function imageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const original = reader.result;
      const img = new Image();
      img.onerror = () => resolve(original);
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}

async function toStoredFile(file) {
  const isImage = file.type && file.type.startsWith('image/');
  return { name: file.name, url: isImage ? await imageToDataUrl(file) : SAMPLE_DOCUMENT };
}

async function parseBody(body, headers) {
  if (body === undefined || body === null) return {};
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const fields = {};
    const files = [];
    for (const [key, value] of body.entries()) {
      if (typeof value === 'string') fields[key] = value;
      else files.push(value);
    }
    return { ...fields, files: await Promise.all(files.map(toStoredFile)) };
  }
  if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
  if (typeof body === 'string') {
    if ((headers.get('Content-Type') || '').includes('application/x-www-form-urlencoded')) {
      return Object.fromEntries(new URLSearchParams(body).entries());
    }
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

export function installMockApi() {
  if (typeof window === 'undefined' || window.__aygDemo) return;

  const backend = createBackend(localStorageAdapter);
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const request = typeof Request !== 'undefined' && input instanceof Request ? input : null;
    let url;
    try {
      url = new URL(request ? request.url : String(input), window.location.origin);
    } catch {
      return realFetch(input, init);
    }
    if (!url.pathname.startsWith(`${API_PREFIX}/`)) return realFetch(input, init);

    const headers = new Headers(init.headers || request?.headers || {});
    const method = String(init.method || request?.method || 'GET').toUpperCase();
    const token = (headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || null;

    // Small delay so loading states are visible, like a real network round trip.
    await sleep(120 + Math.random() * 180);

    const body = await parseBody(init.body, headers);
    const { status, data } = backend.handle({
      method,
      path: url.pathname.slice(API_PREFIX.length),
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      token,
    });

    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  window.__aygDemo = {
    reset() {
      // Wipe sessions and preferences too, then store a fresh copy of the sample data.
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        // storage unavailable: nothing to clear
      }
      backend.reset();
      window.location.assign('/');
    },
  };
}

export function resetDemoData() {
  window.__aygDemo?.reset();
}
