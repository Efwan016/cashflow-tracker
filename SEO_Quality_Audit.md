# SEO Quality Audit — cashflow-app
Generated from repo inspection and current live preview.

## Current State Summary
- **Pattern**: pure React SPA (`react-router-dom`)
- **Hosting**: Vercel
- **Language/Indexing risk**: high if we keep only client-side routing
- **Build/Lint/Tests**: all green
  - build: `tsc -b && vite build` OK
  - lint: `eslint .` OK
  - tests: `vitest --run` 26/26 passed
- **Real URL**: https://adzanitech.web.id/
- **SEO files checked**: none found
  - no `public/robots.txt`

## Critical Issues
1) **URL inconsistency / canonical mismatch**
- OG/Twitter URLs point to `https://cashflow-tracker-henna.vercel.app/`
- Actual live URL is `https://adzanitech.web.id/`
- Effect: bad canonical signal, affected share previews

2) **No robots.txt**
- Missing at `/robots.txt`
- Risk: crawlers may crawl unnecessary app routes; no sitemap hint

3) **No sitemap.xml**
- Search engines have no explicit route map
- SPA dynamic pages are largely invisible without it

4) **No dynamic SEO metas for routes**
- `index.html` has a single static title/description/OG block
- Internal pages (`/dashboard`, `/transactions`, `/products`, `/expenses`, `/inventory`, `/reports`, `/profile`, `/settings`, `/terms`, `/privacy`) have no unique `<title>`, `<meta description>`, or `<link rel="canonical">`
- Solution needs either:
  - SSR/SSG/ISR via Next.js/Astro/Remix, **or**
  - `prerender` / `react-helmet-async` + Vercel `prerender` config, **or**
  - Vercel Prerender / `@vercel/prerender` for key pages
  Without this, internal routes are weak for SEO.

5) **No structured data / schema.org**
- No `application/ld+json`
- For an app with auth gating, SEO value is limited, but legal/info pages (`/terms`, `/privacy`) benefit from WebSite/Organization markup

6) **No hreflang setup**
- App supports 10 languages explicitly
- No language targeting mechanism

7) **Live page content is extremely thin for crawlers**
- Auth form is shown to crawlers too; main content is mostly a card + form
- Contrast/gradients don’t count as indexable content
- No crawlable USP text, no semantic FAQs, no blog/docs

8) **Missing asset SEO basics**
- No `sitemap.xml`, no `robots.txt`
- `favicon.svg` exists; no `apple-touch-icon.png`
- No manifest file consistently referenced

## Recommended Fixes (prioritized)
### P0 — same-day stability
1. Update canonical + OG/Twitter URLs to current domain:
   - `index.html` lines: 16-19, 22-25
   - Set to `https://adzanitech.web.id/`
2. Add `/public/robots.txt` allowing public routes and referencing sitemap:
   - `/robots.txt` → allow `/`, disallow `/settings`-ish private areas if desired, reference `https://adzanitech.web.id/sitemap.xml`
3. Add `/public/sitemap.xml` with routes that should be indexed:
   - `/`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`
   - plus any landing/docs pages
4. Add a small `manifest.webmanifest` for mobile/web app appearance:
   - `name`, `short_name`, `start_url`, `display: standalone`, theme color

### P1 — route-level discoverability (requires deploy pipeline)
5. Implement per-route `<title>` and `<meta name="description">` for:
   - `/`, `/terms`, `/privacy` as public-high-value pages
   - `/dashboard`, `/reports`, `/transactions`, `/products`, `/inventory` as internal
   Options:
   - Use `react-helmet-async` if staying on Vite
   - Or use `@vercel/prerender` on critical public pages and keep static `index.html` tags for them
6. Add canonical per route:
   - Public routes: `https://adzanitech.web.id/...`
   - Internal routes: noindex or rel=canonical to itself + `noindex, follow` in meta robots
7. Add Organization schema on `/` or `/terms`:
   - name, url, sameAs

### P2 — long-term architecture
8. Consider SSR/SSG for SEO surface:
   - Public marketing/docs + `/terms`, `/privacy` in Next.js or Astro
   - Keep Supabase auth app as current SPA on `/app`
9. Add OGP + Twitter image for `/terms` and `/privacy`
10. Add `alt` text semantics and avoid empty `<h1>` for crawlers on key pages

## Why This Matters for Your App
Since most routes require auth, search engines effectively only index the login page and a few public pages. That means:
- targeting must be niche/gated: brand (`adzanitech`), terms, privacy
- all public-facing metadata should be perfect for those pages specifically
- internal pages still matter for user shareability and app indexing
- **SSR is not strictly required** for SEO to improve materially; the bigger wins are canonical accuracy + public-page metadata + robots/sitemap

## Quick Wins to Implement Now
1) Update OG canonical URLs in `index.html` to `https://adzanitech.web.id/`
2) Add `public/robots.txt`
3) Add `public/sitemap.xml`
4) Add per-route titles manually for public pages
5) Add `application/ld+json` for Organization to the home page
