const fs = require('node:fs/promises');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
// Backend the server forwards /api and /uploads to (same-origin deployment, no CORS needed).
const API_PROXY_TARGET = process.env.API_PROXY_TARGET;
// Demo build (the default): never let search engines index it.
const DEMO_MODE = process.env.VITE_DEMO_MODE !== 'false';

function getSeoForPath(url) {
  const pathname = new URL(url, SITE_URL).pathname;

  if (pathname === '/') {
    return {
      title: 'AYG real estate | Studios For Rent And Apartments For Sale',
      description:
        'Find furnished studios for rent and apartments for sale in Maadi and Mokattam with AYG real estate.',
      canonicalPath: '/',
      noIndex: false,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'AYG real estate',
        url: SITE_URL,
      },
    };
  }

  if (pathname === '/studios') {
    return {
      title: 'Studios For Rent In Cairo',
      description:
        'Browse available studios for rent with verified amenities, photos, and pricing details.',
      canonicalPath: '/studios',
      noIndex: false,
    };
  }

  if (pathname.startsWith('/studio/')) {
    return {
      title: 'Studio Details | AYG',
      description:
        'View full studio details including location, furnishing, and rent terms.',
      canonicalPath: '/studios',
      noIndex: false,
    };
  }

  if (pathname === '/buy-apartments') {
    return {
      title: 'Apartments For Sale In Cairo',
      description:
        'Explore apartments for sale with up-to-date prices and neighborhood highlights.',
      canonicalPath: '/buy-apartments',
      noIndex: false,
    };
  }

  if (pathname.startsWith('/apartment-sale/')) {
    return {
      title: 'Apartment Sale Details | AYG',
      description:
        'Check apartment sale details, photos, and location information before booking a visit.',
      canonicalPath: '/buy-apartments',
      noIndex: false,
    };
  }

  return {
    title: 'AYG real estate',
    description: 'Real estate platform for studios and apartments in Cairo.',
    canonicalPath: pathname,
    noIndex:
      pathname.startsWith('/admin') || pathname.startsWith('/master-admin'),
  };
}

function buildHead(url) {
  const seo = getSeoForPath(url);
  const canonical = `${SITE_URL}${seo.canonicalPath || '/'}`;
  const robots = seo.noIndex || DEMO_MODE ? 'noindex,nofollow' : 'index,follow';
  const ogImage = `${SITE_URL}/AYG.png`;
  const structuredDataTag = seo.structuredData
    ? `<script type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`
    : '';

  return `
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="${robots}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seo.title}" />
    <meta name="twitter:description" content="${seo.description}" />
    <meta name="twitter:image" content="${ogImage}" />
    ${structuredDataTag}
  `;
}

async function createServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');
  app.get('/health', (req, res) => res.json({ status: 'healthy' }));

  if (API_PROXY_TARGET) {
    app.use(
      createProxyMiddleware({
        target: API_PROXY_TARGET,
        changeOrigin: true,
        pathFilter: ['/api', '/uploads'],
      })
    );
  } else if (isProd) {
    console.log('API_PROXY_TARGET not set: /api and /uploads are expected to be routed to the backend by the platform.');
  }

  let vite;
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('./dist/client', { index: false }));
  }

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      let template;
      let render;

      if (!isProd) {
        template = await fs.readFile('./index.html', 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render;
      } else {
        template = await fs.readFile('./dist/client/index.html', 'utf-8');
        render = (await import('./dist/server/entry-server.mjs')).render;
      }

      const { appHtml, dehydratedState } = await render(url);
      const head = buildHead(url);

      const html = template
        .replace('<!--app-head-->', `${head}\n<script>window.__TANSTACK_DEHYDRATED_STATE__=${JSON.stringify(dehydratedState)}</script>`)
        .replace('<!--app-html-->', appHtml);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      if (vite) {
        vite.ssrFixStacktrace(error);
      }
      console.error(error);
      res.status(500).end(isProd ? 'Internal Server Error' : error.message);
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`SSR server running at http://localhost:${port}`);
  });
}

createServer();
