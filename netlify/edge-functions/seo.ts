// Netlify Edge Function: free-tier SEO for Fast7.
//
// What it does (all on Netlify's free plan, no extra services):
//  1. Serves per-restaurant <title>, description, Open Graph, Twitter card,
//     canonical and JSON-LD for restaurant pages (path /{domain} or the
//     restaurant's own subdomain) by injecting them into the served SPA HTML.
//     Fix: social crawlers (Facebook/WhatsApp/iMessage) do NOT run JavaScript,
//     so without this they only ever see the generic index.html defaults.
//  2. Serves /sitemap.xml dynamically, listing every live restaurant site.
//  3. Appends a "Sitemap:" line to the static /robots.txt with the correct
//     absolute URL for the current host.
//
// Safety rules (baked in — this must never break the site):
//  - Every failure path returns the ORIGINAL downstream response untouched.
//  - Only GET requests are processed; everything else passes through.
//  - Responses that are not text/html (JS, CSS, images, JSON APIs) are never
//    modified; they are returned as-is without even reading their body.
//  - The Firestore REST read uses the same public web API key already shipped
//    in the client bundle (src/firebase.ts) and the same Firestore security
//    rules the website already relies on for anonymous reads. No new
//    credentials are introduced.
//  - If Firestore cannot be reached, or a path does not correspond to a
//    restaurant, the original page is served as-is.
//
// Known limitation: restaurant sites accessed through a fully custom domain
// (path "/") cannot be mapped to a Firestore doc without an extra query, so
// meta injection applies to /{domain} paths and restaurant subdomains; those
// pages still get client-side SEO tags once JS runs, as before.

type EdgeContext = {
  next: () => Promise<Response>;
};

type RestaurantMeta = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  coverPhoto: string;
};

// Public web config — identical to src/firebase.ts (public by design).
const FIREBASE_PROJECT_ID = "dash-f4779";
const FIREBASE_API_KEY_FALLBACK = "AIzaSyBV6uT9WvilgK8xpoSYmDH5s9ASqvm7PXI";

const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";

// Routes that are NOT restaurant pages (mirrors src/App.tsx routing).
const RESERVED_SEGMENTS = new Set([
  "manage",
  "onboarding",
  "track",
  "tracking-demo",
  "templates",
  "home",
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
]);

// Host labels that mean "the main site", not a restaurant subdomain
// (mirrors App.tsx's isSubdomain check).
const HOST_LABELS_EXCLUDED = new Set([
  "fast7",
  "www",
  "manage",
  "localhost",
  "192",
]);

const SENTINEL_OPEN = "<!-- fast7:seo -->";
const SENTINEL_CLOSE = "<!-- /fast7:seo -->";

const CACHE_TTL_MS = 60_000;
type CacheEntry = { value: RestaurantMeta | null; expires: number };
type SitemapCacheEntry = { value: string; expires: number };
const metaCache = new Map<string, CacheEntry>();
const sitemapCache = new Map<string, SitemapCacheEntry>();

function readApiKey(): string {
  try {
    // Netlify.env exists in the edge runtime; guarded so local tooling never
    // breaks on it.
    const env = (globalThis as any).Netlify?.env;
    const fromEnv = env?.get?.("FIREBASE_API_KEY") || env?.get?.("VITE_FIREBASE_API_KEY");
    if (fromEnv) return fromEnv;
  } catch {
    // ignore — fall back to the bundled public key
  }
  return FIREBASE_API_KEY_FALLBACK;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function safeJsonLd(value: unknown): string {
  // "<" is escaped so the JSON can never terminate the script tag early.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Which Firestore doc id, if any, does this URL refer to? */
function resolveDocId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  const hostLabel = host.split(".")[0] ?? "";
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    // Root path — a restaurant subdomain (e.g. foodsvilla.fast7.netlify.app)
    // serves its site at "/"; the main site serves the landing page there.
    if (!hostLabel || HOST_LABELS_EXCLUDED.has(hostLabel)) return null;
    return hostLabel;
  }

  const first = segments[0];
  const firstLower = first.toLowerCase();
  if (RESERVED_SEGMENTS.has(firstLower)) return null;
  if (first.startsWith(".")) return null; // Netlify function paths etc.
  // Anything that looks like a file (script, image, font, ...) is not a route.
  if (/\.[a-z0-9]+$/i.test(first)) return null;
  return first;
}

async function fetchRestaurantMeta(docId: string): Promise<RestaurantMeta | null> {
  const now = Date.now();
  const cached = metaCache.get(docId);
  if (cached && cached.expires > now) return cached.value;

  const base = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/restaurants`;
  let meta: RestaurantMeta | null = null;

  try {
    const fetchDoc = async (id: string) => {
      const res = await fetch(
        `${base}/${encodeURIComponent(id)}?key=${encodeURIComponent(readApiKey())}`,
        { headers: { Accept: "application/json" } },
      );
      return res.ok ? await res.json() : null;
    };

    // Doc ids are usually the plain domain prefix, but onboarding also allows
    // dotted values; try both like the client site does.
    let doc = await fetchDoc(docId);
    if (!doc && docId.includes(".")) {
      doc = await fetchDoc(docId.split(".")[0]);
    }

    if (doc) {
      const f = doc.fields ?? {};
      const info = f.restaurantInfo?.mapValue?.fields ?? {};
      const name = oneLine(info.name?.stringValue ?? f.domainName?.stringValue ?? "");
      if (name) {
        meta = {
          name,
          description: oneLine(info.bio?.stringValue ?? ""),
          phone: oneLine(info.phone?.stringValue ?? ""),
          email: oneLine(info.email?.stringValue ?? ""),
          address: oneLine(info.address?.stringValue ?? ""),
          coverPhoto: oneLine(f.coverPhoto?.stringValue ?? ""),
        };
      }
    }
  } catch {
    meta = null;
  }

  metaCache.set(docId, { value: meta, expires: now + CACHE_TTL_MS });
  return meta;
}

function buildHeadBlock(meta: RestaurantMeta, canonical: string): string {
  const title = `${meta.name} — Order Food Online`;
  const description =
    meta.description ||
    `Order delicious food online from ${meta.name} — fresh ingredients, fast delivery.`;
  const image = meta.coverPhoto || DEFAULT_OG_IMAGE;

  const jsonLd = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: meta.name,
    description,
    url: canonical,
    image: meta.coverPhoto || undefined,
    telephone: meta.phone || undefined,
    email: meta.email || undefined,
    address: meta.address
      ? { "@type": "PostalAddress", streetAddress: meta.address }
      : undefined,
    priceRange: "₹₹",
  });

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(description)}" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:type" content="restaurant.restaurant" />
    <meta property="og:url" content="${escapeAttr(canonical)}" />
    <meta property="og:image" content="${escapeAttr(image)}" />
    <meta property="og:site_name" content="Fast7" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(image)}" />
    <link rel="canonical" href="${escapeAttr(canonical)}" />
    <script type="application/ld+json">${jsonLd}</script>
  `;
}

/**
 * Replace the sentinel-wrapped default SEO block with restaurant-specific
 * tags. If the sentinels are missing (unexpected HTML), fall back to
 * inserting before </head> so nothing is lost.
 */
function injectSeo(html: string, block: string): string {
  const open = html.indexOf(SENTINEL_OPEN);
  const close = html.indexOf(SENTINEL_CLOSE);
  if (open !== -1 && close !== -1 && close > open) {
    return (
      html.slice(0, open + SENTINEL_OPEN.length) +
      block +
      html.slice(close)
    );
  }
  return html.replace("</head>", `${block}\n</head>`);
}

/** Copy headers from the upstream response, dropping validators that no
 * longer match the (modified) body. */
function responseHeaders(upstream: Response): Headers {
  const headers = new Headers(upstream.headers);
  headers.delete("content-length");
  headers.delete("etag");
  headers.delete("last-modified");
  return headers;
}

function htmlResponse(body: string, upstream: Response): Response {
  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders(upstream),
  });
}

async function handleSitemap(origin: string): Promise<Response> {
  const now = Date.now();
  const cached = sitemapCache.get(origin);
  if (cached && cached.expires > now) {
    return new Response(cached.value, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const urls: string[] = [`${origin}/`, `${origin}/templates`];
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/restaurants?pageSize=300&mask.fieldPaths=domainName&key=${encodeURIComponent(readApiKey())}`,
      { headers: { Accept: "application/json" } },
    );
    if (res.ok) {
      const data = await res.json();
      for (const doc of data.documents ?? []) {
        const id = doc.name?.split("/").pop();
        // Skip any restaurant whose domain collides with a reserved route.
        if (id && !RESERVED_SEGMENTS.has(id.toLowerCase())) {
          urls.push(`${origin}/${id}`);
        }
      }
    }
  } catch {
    // Fall back to the homepage-only sitemap below.
  }

  const items = urls
    .map((u) => `  <url><loc>${escapeAttr(u)}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
  sitemapCache.set(origin, { value: xml, expires: now + CACHE_TTL_MS });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function handleRobots(
  upstream: Response,
  origin: string,
): Promise<Response> {
  let text: string;
  try {
    text = await upstream.text();
  } catch {
    return new Response(null, { status: 502 });
  }
  try {
    if (!text.includes("Sitemap:")) {
      text = `${text.trimEnd()}\n\nSitemap: ${origin}/sitemap.xml\n`;
      return new Response(text, {
        status: upstream.status,
        headers: responseHeaders(upstream),
      });
    }
    return htmlResponse(text, upstream);
  } catch {
    return htmlResponse(text, upstream);
  }
}

export default async (request: Request, context: EdgeContext): Promise<Response> => {
  let upstream: Response;
  try {
    upstream = await context.next();
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  try {
    if (request.method !== "GET") return upstream;

    const url = new URL(request.url);
    const origin = url.origin;

    if (url.pathname === "/sitemap.xml") {
      return await handleSitemap(origin);
    }

    if (url.pathname === "/robots.txt") {
      return await handleRobots(upstream, origin);
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (upstream.status !== 200 || !contentType.includes("text/html")) {
      return upstream;
    }

    const docId = resolveDocId(url);
    if (!docId) return upstream;

    const meta = await fetchRestaurantMeta(docId);
    if (!meta) return upstream;

    let html: string;
    try {
      html = await upstream.text();
    } catch {
      return new Response(null, { status: 502 });
    }

    // Path-based canonical matches the client-side effect: /{domain}.
    const canonical = `${origin}/${docId}`;

    try {
      return htmlResponse(injectSeo(html, buildHeadBlock(meta, canonical)), upstream);
    } catch {
      return htmlResponse(html, upstream);
    }
  } catch {
    // Absolute fallback: never break a page because of SEO.
    return upstream;
  }
};

export const config = {
  path: "/*",
};
