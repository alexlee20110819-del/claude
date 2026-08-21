# Thomson & Foley Property Maintenance — marketing site

A static, dependency-free site for a two-person lawn and garden business in
Bargara, Queensland. Rebuilt from the layout of the existing Cloudflare Pages
site, with the same composition and visual language and a considerably stricter
build underneath it.

```
site/                  ← this is the deploy root
  *.html               generated — edit tools/site-data.mjs, not these
  css/site.css         hand-written, ~620 lines, no framework
  js/site.js           ~5 KB, no dependencies
  assets/img/          AVIF at 2–3 widths each + a JPEG fallback
  assets/fonts/        self-hosted Switzer + Playfair Display
  _headers             CSP + cache rules for Cloudflare Pages / Netlify
  vercel.json          the same rules in Vercel's format
tools/
  site-data.mjs        all copy, services, reviews, gallery, FAQ, areas
  build-site.mjs       page assembly, <picture> helper, JSON-LD
```

## Working on it

```bash
npm run build:site     # regenerate the HTML from tools/
npm run serve:site     # http://localhost:4173
```

Every page is assembled from one header, one footer and one `<head>` template,
so the phone number, a menu item or a service description changes in exactly one
place — `tools/site-data.mjs` — and then `npm run build:site`.

## What differs from the site it was rebuilt from

**Weight.** GSAP, ScrollTrigger and Lenis (~120 KB from three CDNs) are gone,
replaced by ~5 KB of vanilla JS. Fonts are self-hosted, so first paint makes no
third-party connection at all. Photos ship as AVIF at the width the layout
actually asks for, behind a real `srcset`, over a progressive-JPEG fallback.
There is no WebP tier on purpose: on grass and foliage this detailed, WebP
encoded *larger* than mozjpeg at matched quality (488 KB vs 404 KB vs 228 KB
for AVIF on the same 1440 px hero), so it would have cost bytes while serving
its browsers worse than the fallback they get instead.

**Images.** Every photo has explicit dimensions, so nothing shifts as the page
loads. The hero image on each page is preloaded and marked `fetchpriority=high`;
everything else is lazy. Photos that sit behind a heavy scrim are compressed
harder than the ones a visitor studies.

**Accessibility.** A skip link, one `<h1>` per page, breadcrumbs on sub-pages,
visible focus rings, and a mobile menu that moves focus in, traps it, closes on
Escape and hands focus back. The panel ships `inert` so the closed menu can
never be tabbed into. The lightbox has arrow-key and swipe navigation, a
position caption and focus restore. All body text clears WCAG AA — checked, not
assumed. `prefers-reduced-motion` disables every animation, parallax included.

**Resilience.** With JavaScript disabled the pages still render, read and
navigate: reveal animations only apply under `html.js`, and the FAQ is native
`<details>`. The reveal observer treats anything already scrolled past as
revealed, so deep links and End never strand a section at zero opacity.

**Findability.** Canonical URLs, per-page titles and descriptions, Open Graph
and Twitter cards with a purpose-cropped 1200×630 image, `sitemap.xml`,
`robots.txt`, a web manifest, a real 404 page, and JSON-LD for
`LandscapingBusiness` (with rating, service catalogue and service areas),
`FAQPage` and `BreadcrumbList`.

**Content the original did not have.** A filterable gallery (30 photos across
four categories), a rating breakdown on the reviews page, a jump rail on
services, a scroll-progress hairline in the nav, and service-area pills.

## The quote form

`BIZ.formEndpoint` in `tools/site-data.mjs` is empty. Point it at whatever
handles the form — Formspree, a Cloudflare Worker, Netlify Forms — and rebuild.

Until it is set, the form validates in the page and then opens a pre-filled
email to the business rather than pretending to send. It never silently
swallows an enquiry. There is a honeypot field and a timestamp for spam
filtering.

## Deploying

Publish the `site/` directory. There is no build step on the host — run
`npm run build:site` locally and commit the output.

- **Vercel** — root directory `site`, no build command. `site/vercel.json`
  carries the header and cache rules; it is a static deployment, so nothing is
  installed or built on the host.
- **Cloudflare Pages** — build command empty, output directory `site`.
- **Netlify** — `publish = "site"`, no build command. The repo root
  `netlify.toml` currently deploys a different app; use a separate site or
  change `publish` there.

## Photography and brand

The photographs, logo and reviews belong to Thomson & Foley Property
Maintenance and were carried over from their existing site. Swap
`site/assets/img/` and re-run the image pipeline if the source photos change.
