/* ============================================================================
   Static site generator for site/
   ----------------------------------------------------------------------------
   The reference build kept six near-identical copies of the nav, footer and
   head. Here the chrome is written once and every page is assembled from it,
   so a phone number or a menu item changes in one place.

   Run: npm run build:site
   ========================================================================== */
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIZ, NAV, SERVICES, REVIEWS, GALLERY, GALLERY_FILTERS, FAQ_HOME, FAQ_SERVICES, STEPS, AREAS } from './site-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const IMGDIR = path.join(ROOT, 'assets', 'img');

/* ── Image manifest, discovered from what is actually on disk ─────────────── */
const IMG = {};
async function scanImages(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { await scanImages(path.join(dir, entry.name), prefix + entry.name + '/'); continue; }
    const m = /^(.+?)-(\d+)\.avif$/.exec(entry.name);
    if (!m) continue;
    const key = prefix + m[1];
    (IMG[key] ||= { widths: new Set() }).widths.add(+m[2]);
  }
}
await scanImages(IMGDIR);
for (const v of Object.values(IMG)) v.widths = [...v.widths].sort((a, b) => a - b);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * <picture> with an AVIF srcset over a progressive-JPEG fallback, plus
 * intrinsic dimensions so nothing shifts while the page loads.
 * `ratio` is the box the art is cropped into (object-fit does the rest); when
 * omitted the widest generated size sets the attributes.
 */
function pic(name, { alt = '', sizes = '100vw', eager = false, ratio, cls = '' } = {}) {
  const m = IMG[name];
  if (!m) throw new Error('no image: ' + name);
  const set = (ext) => m.widths.map((w) => `assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const w = m.widths[m.widths.length - 1];
  const h = Math.round(ratio ? w / ratio : w * 0.75);
  return `<picture${cls ? ` class="${cls}"` : ''}>
<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
<img src="assets/img/${name}.jpg" alt="${esc(alt)}" width="${w}" height="${h}"${
  eager ? ' fetchpriority="high" decoding="sync"' : ' loading="lazy" decoding="async"'}>
</picture>`;
}
function preload(name, sizes) {
  const m = IMG[name];
  return `<link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesizes="${sizes}"
      imagesrcset="${m.widths.map((w) => `assets/img/${name}-${w}.avif ${w}w`).join(', ')}">`;
}

const ICON = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg class="ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="m22 6-10 7L2 6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
  google: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.36-1.6 3.99-5.27 3.99a5.99 5.99 0 0 1 0-11.98c1.7 0 2.85.72 3.5 1.35l2.39-2.3C16.53 3.66 14.55 2.8 12.17 2.8a9.2 9.2 0 1 0 0 18.4c5.31 0 8.83-3.73 8.83-8.99 0-.6-.06-1.06-.15-1.51Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
};

const STARS = (n) => n ? `<span class="stars" aria-label="${n} out of 5 stars">${'★'.repeat(n)}</span>` : '';
const CALL = (cls) => `<a class="btn ${cls}" href="${BIZ.phoneHref}">${ICON.phone}Call ${BIZ.phone}</a>`;
const QUOTE = (cls, label = 'Get a free quote', arrow = false) =>
  `<a class="btn ${cls}" href="contact.html">${label}${arrow ? ' ' + ICON.arrow : ''}</a>`;

const brand = (light) => `<a class="brand${light ? ' brand--light' : ''}" href="index.html">
<img class="brand__img" src="assets/logo.png" alt="" width="240" height="185" decoding="async">
<span class="brand__txt"><b>${BIZ.short}</b><small>${BIZ.tagline}</small></span>
</a>`;

/* ── Chrome ──────────────────────────────────────────────────────────────── */
function header(current) {
  const link = (n) => `<a href="${n.href}"${n.href === current ? ' aria-current="page"' : ''}>${n.label}</a>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="nav" data-nav>
  <div class="nav__pill">
    ${brand()}
    <div class="nav__right">
      <nav class="nav__links" aria-label="Primary">${NAV.map(link).join('')}</nav>
      ${CALL('btn--goldline navphone')}
      ${QUOTE('btn--gold')}
      <button class="burger" data-menu-open aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
    </div>
    <span class="nav__progress" data-progress aria-hidden="true"></span>
  </div>
</header>

<div class="menu" id="mobile-menu" data-menu inert aria-hidden="true" aria-label="Menu">
  <div class="menu__top">${brand(true)}<button class="menu__close" data-menu-close aria-label="Close menu">&#10005;</button></div>
  <nav class="menu__links" aria-label="Mobile">
    ${[...NAV, { href: 'contact.html', label: 'Contact' }].map((n, i) =>
      `<a href="${n.href}"${n.href === current ? ' aria-current="page"' : ''}><span class="n">0${i + 1}</span>${n.label}</a>`).join('\n    ')}
  </nav>
  <div class="menu__foot">
    <a href="${BIZ.phoneHref}">${BIZ.phone}</a>
    <a href="mailto:${BIZ.email}">${BIZ.email}</a>
    <span>${BIZ.area}</span>
  </div>
</div>`;
}

const footer = () => `<footer class="foot">
  <div class="wrap">
    <div class="foot__cols">
      <div class="foot__brand">
        ${brand(true)}
        <p>All lawn care and gardening services across ${BIZ.area}. Lawn mowing, full garden tidy-ups, tree pruning, hedge trimming, green waste removal, mulch installs and light landscaping.</p>
        <div class="socials">
          <a href="${BIZ.facebook}" target="_blank" rel="noopener" aria-label="${esc(BIZ.name)} on Facebook">${ICON.fb}</a>
          <a href="${BIZ.google}" target="_blank" rel="noopener" aria-label="${esc(BIZ.name)} on Google">${ICON.google}</a>
        </div>
      </div>
      <nav aria-labelledby="f-explore">
        <h2 id="f-explore">Explore</h2>
        <a href="about.html">About</a><a href="services.html">Services</a><a href="gallery.html">Our Work</a><a href="reviews.html">Reviews</a><a href="contact.html">Contact</a>
      </nav>
      <div>
        <h2>Where they work</h2>
        <p>Bargara</p><p>Bundaberg region</p><p>And surrounding areas</p>
      </div>
      <div>
        <h2>Get in touch</h2>
        <a class="fcontact" href="${BIZ.phoneHref}">${ICON.phone}${BIZ.phone}</a>
        <a class="fcontact" href="mailto:${BIZ.email}">${ICON.mail}${BIZ.email}</a>
        <a class="fcontact" href="${BIZ.facebook}" target="_blank" rel="noopener">${ICON.fb}Message on Facebook</a>
      </div>
    </div>
  </div>
  <div class="foot__word" aria-hidden="true">THOMSON&nbsp;&amp;&nbsp;FOLEY</div>
  <div class="wrap"><div class="foot__base"><span>&copy; <span data-year>2026</span> ${esc(BIZ.name)}</span><span>Bargara, Queensland</span></div></div>
</footer>
<a class="callbar" href="${BIZ.phoneHref}">${ICON.phone}Call ${BIZ.phone}</a>`;

/* ── Structured data ─────────────────────────────────────────────────────── */
const localBusiness = {
  '@context': 'https://schema.org', '@type': 'LandscapingBusiness',
  '@id': BIZ.origin + '/#business', name: BIZ.name, url: BIZ.origin + '/',
  telephone: '+61468373784', email: BIZ.email, image: BIZ.origin + '/assets/og-cover.jpg',
  logo: BIZ.origin + '/assets/logo.png', priceRange: '$$',
  address: { '@type': 'PostalAddress', addressLocality: 'Bargara', addressRegion: 'QLD', addressCountry: 'AU' },
  areaServed: AREAS.filter((a) => !a.startsWith('and')).map((n) => ({ '@type': 'Place', name: n })),
  sameAs: [BIZ.facebook, BIZ.google],
  aggregateRating: { '@type': 'AggregateRating', ratingValue: BIZ.rating, reviewCount: BIZ.reviewCount, bestRating: 5 },
  hasOfferCatalog: {
    '@type': 'OfferCatalog', name: 'Lawn care and gardening services',
    itemListElement: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } })),
  },
};
const faqSchema = (list) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
const crumbSchema = (label, href) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BIZ.origin + '/' },
    { '@type': 'ListItem', position: 2, name: label, item: BIZ.origin + '/' + href },
  ],
});
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

/* ── Page shell ──────────────────────────────────────────────────────────── */
function page({ file, title, description, body, head = '', schema = [], noindex = false }) {
  const canonical = BIZ.origin + '/' + (file === 'index.html' ? '' : file);
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta name="theme-color" content="#05150C">
<meta property="og:site_name" content="${esc(BIZ.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_AU">
<meta property="og:image" content="${BIZ.origin}/assets/og-cover.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${BIZ.origin}/assets/og-cover.jpg">
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="apple-touch-icon" href="assets/icon-512.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/switzer-600.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="assets/fonts/switzer-400.woff2" crossorigin>
${head}
<link rel="stylesheet" href="css/site.css">
<script>document.documentElement.classList.add('js')</script>
${[...schema].map(jsonld).join('\n')}
</head>
<body>
${header(file)}
<main id="main">
${body}
</main>
${footer()}
<script src="js/site.js" defer></script>
</body>
</html>
`;
}

/* ── Shared section builders ─────────────────────────────────────────────── */
const pagehero = ({ img, alt, h1, sub, crumb, actions, eager = true }) => `<section class="hero pagehero">
  <div class="hero__media" data-parallax>${pic(img, { alt, sizes: '100vw', eager, ratio: 4 / 3 })}</div>
  <div class="hero__shade"></div>
  <div class="hero__in">
    <div class="hero__copy">
      <nav aria-label="Breadcrumb"><ol class="crumbs"><li><a href="index.html">Home</a></li><li><span aria-current="page">${crumb}</span></li></ol></nav>
      <h1 class="hero__h1" data-reveal>${h1}</h1>
      <p class="hero__sub" data-reveal>${sub}</p>
      <div class="hero__actions" data-reveal>${actions}</div>
    </div>
  </div>
</section>`;

const featureBand = ({ img, alt, h2, lead, actions, plain = false, extra = '' }) => `<section class="feature${plain ? ' feature--plain' : ''}">
  ${plain ? '' : `<div class="feature__media" data-parallax-soft>${pic(img, { alt, sizes: '100vw', ratio: 4 / 3 })}</div>\n  <div class="feature__shade"></div>`}
  <div class="wrap feature__in">
    <div class="srule srule--g" data-reveal></div>
    <h2 class="h2 h2--light" data-reveal>${h2}</h2>
    <p class="lead lead--light" data-reveal>${lead}</p>
    ${actions ? `<div class="hero__actions" data-reveal>${actions}</div>` : ''}
    ${extra}
  </div>
</section>`;

const bigcta = ({ img, alt, h, sub }) => `<section class="bigcta">
  <div class="bigcta__media" data-parallax-soft>${pic(img, { alt, sizes: '100vw', ratio: 4 / 3 })}</div>
  <div class="bigcta__shade"></div>
  <div class="wrap bigcta__in">
    <h2 class="bigcta__h" data-reveal>${h}</h2>
    <p class="bigcta__sub" data-reveal>${sub}</p>
    <div class="hero__actions" data-reveal style="justify-content:center">${QUOTE('btn--gold btn--lg', 'Get a free quote', true)}${CALL('btn--ghost btn--lg')}</div>
  </div>
</section>`;

const faqBlock = (list, { h2, lead }) => `<section class="section pt0">
  <div class="wrap faqwrap">
    <div class="faqhead">
      <div class="srule" data-reveal></div>
      <h2 class="h2" data-reveal>${h2}</h2>
      <p class="lead" data-reveal>${lead}</p>
    </div>
    <div class="faq" data-reveal>
      ${list.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}<span class="pl" aria-hidden="true"></span></summary><p>${a}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>`;

const reviewCard = (r) => `<figure class="rcard" data-reveal>${STARS(r.stars)}<blockquote>${r.text}</blockquote><cite><b>${esc(r.name)}</b><span>${r.src}</span></cite></figure>`;


/* ══════════════════════════════════════════════════════════════════════════
   PAGES
   ══════════════════════════════════════════════════════════════════════════ */
const pages = {};

/* ── Home ────────────────────────────────────────────────────────────────── */
pages['index.html'] = page({
  file: 'index.html',
  title: `${BIZ.name} | Lawn & Garden Care, Bargara`,
  description: 'Lawn mowing, garden tidy-ups, tree pruning and green waste removal in Bargara, Bundaberg and surrounding areas. Rated 5.0. Free quotes.',
  head: preload('home-hero', '(max-width:980px) 100vw, 48vw'),
  schema: [localBusiness, faqSchema(FAQ_HOME)],
  body: `<!-- HERO: split panel + gold seam (the signature) -->
<section class="hero hero--split">
  <div class="hero__panel">
    <div class="hero__copy">
      <h1 class="hero__h1" data-reveal>A yard that looks <em>looked after.</em></h1>
      <p class="hero__sub" data-reveal>Lawn mowing, garden tidy-ups, palms and hedges across ${BIZ.area}. Leo and Chantel do the whole job, then take the green waste with them.</p>
      <div class="hero__actions" data-reveal>${QUOTE('btn--gold btn--lg', 'Get a free quote', true)}${CALL('btn--ghost btn--lg')}</div>
      <p class="hero__stat" data-reveal><b>5.0</b><span>Rated 5.0 on Google and Facebook by locals across the Bundaberg region</span></p>
    </div>
  </div>
  <div class="hero__shot">
    <div class="hero__media" data-parallax>${pic('home-hero', { alt: 'Long grass ahead of a mower being pushed through a Bundaberg region block', sizes: '(max-width:980px) 100vw, 48vw', eager: true, ratio: 4 / 3 })}</div>
    <div class="hero__shade"></div>
    <span class="gseam" aria-hidden="true"></span>
  </div>
  <div class="hero__cardwrap">
    <aside class="hero__card" data-reveal aria-label="Customer rating">
      <div class="hero__card-media">${pic('card-thumb', { alt: 'A mown nature strip beside a kerb', sizes: '80px', ratio: 480 / 357 })}</div>
      <div class="hero__card-body">
        ${STARS(5)}<b>A perfect 5.0 rating</b><small>5.0 on Google and Facebook</small>
        <a class="btn btn--gold btn--sm" href="reviews.html">Read our reviews</a>
      </div>
    </aside>
  </div>
  <span class="scrollcue" aria-hidden="true">Scroll<i></i></span>
</section>

<!-- CREDENTIAL RIBBON -->
<section class="ribbon" aria-label="At a glance">
  <div class="wrap ribbon__row">
    <div class="ribbon__i" data-reveal><b>5.0<i class="star">★</i></b><span>On Google and Facebook</span></div>
    <div class="ribbon__i" data-reveal><b>Leo &amp; Chantel</b><span>The two people who turn up</span></div>
    <div class="ribbon__i" data-reveal><b>Free</b><span>On-site quotes, no pressure</span></div>
    <div class="ribbon__i" data-reveal><b>Bargara</b><span>Bundaberg and surrounding areas</span></div>
  </div>
</section>

<!-- STORY -->
<section class="section" id="about" aria-labelledby="story-h">
  <div class="wrap split">
    <div class="split__media" data-reveal>${pic('home-story', { alt: 'A ute and caged trailer parked at the kerb beside a freshly mown verge', sizes: '(max-width:980px) 92vw, 44vw', ratio: 4 / 3 })}</div>
    <div class="split__body">
      <div class="srule" data-reveal></div>
      <span class="eyebrow" data-reveal>Who you are dealing with</span>
      <h2 class="h2" id="story-h" data-reveal>A small outfit, <em>and that is the point.</em></h2>
      <p class="lead" data-reveal>Thomson &amp; Foley is Leo and Chantel. You deal with the two of them from the quote to the clean-up, so nothing gets lost between an office and a crew. They cover all lawn care and gardening work across ${BIZ.area}, and they finish the job properly before they leave.</p>
      <ul class="ticks" data-reveal>
        <li>All lawn care and gardening services, one call</li>
        <li>Green waste loaded and taken away</li>
        <li>Quick to answer, and they turn up when they say</li>
        <li>The job area left tidy on completion</li>
      </ul>
      <a class="btn btn--dark" data-reveal href="about.html">More about Leo and Chantel ${ICON.arrow}</a>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section class="section pt0" id="services" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="srule" data-reveal></div>
    <div class="shead">
      <div><span class="eyebrow" data-reveal>What they do</span><h2 class="h2" id="svc-h" data-reveal>One call for <em>the whole yard.</em></h2></div>
      <a class="btn btn--line" data-reveal href="services.html">All services</a>
    </div>
    <div class="stiles">
      ${SERVICES.filter((s) => s.tile).map((s) => `<a class="stile" data-reveal href="services.html#${s.id}">
        ${pic(s.tile, { alt: s.tileAlt || s.alt, sizes: '(max-width:620px) 92vw, (max-width:1180px) 46vw, 24vw', ratio: 4 / 3 })}
        <span class="stile__v"></span>
        <div class="stile__b"><h3>${s.title}</h3><p>${s.tileCopy}</p></div>
      </a>`).join('\n      ')}
    </div>
    <p class="sindex" data-reveal><b>Also on the truck:</b> <span>Hedge trimming</span> <span>Green waste removal</span> <span>Mulch installs</span> <span>Light landscaping</span></p>
  </div>
</section>

${featureBand({
  img: 'feature-home', alt: 'A tropical garden bed of cordylines and palms in front of a home',
  h2: 'Overgrown is not <em>a problem.</em>',
  lead: 'Long grass, palms that have got away, a bed that has gone under. Send a photo and you will get a straight price back, then it gets cut, cleared and carted off in one visit.',
  actions: QUOTE('btn--gold btn--lg') + CALL('btn--ghost btn--lg'),
})}

<!-- REVIEWS -->
<section class="section" id="reviews" aria-labelledby="rev-h">
  <div class="wrap">
    <div class="srule srule--c" data-reveal></div>
    <div class="center"><span class="eyebrow" data-reveal>Rated 5.0</span><h2 class="h2" id="rev-h" data-reveal>What the neighbours <em>actually said.</em></h2></div>
    <div class="tgrid">
      <figure class="tfeature" data-reveal>
        ${STARS(5)}
        <blockquote>${REVIEWS[0].text}</blockquote>
        <cite><b>${REVIEWS[0].name}</b><span>${REVIEWS[0].src}</span></cite>
      </figure>
      <aside class="tcta" data-reveal>
        <h3>Want the same at your place?</h3>
        <p>Free on-site quote, a straight price, and the mess gone when they go.</p>
        ${QUOTE('btn--gold')}
        <a class="tcta__ph" href="${BIZ.phoneHref}">or call ${BIZ.phone}</a>
      </aside>
    </div>
    <div class="rgrid">${REVIEWS.slice(1, 4).map(reviewCard).join('\n      ')}</div>
    <p class="center" style="margin-top:2rem"><a class="btn btn--line" data-reveal href="reviews.html">Read all ${BIZ.reviewCount} reviews ${ICON.arrow}</a></p>
  </div>
</section>

<!-- RECENT WORK -->
<section class="section pt0" id="work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="srule" data-reveal></div>
    <div class="shead">
      <div><span class="eyebrow" data-reveal>Recent jobs</span><h2 class="h2" id="work-h" data-reveal>Real yards <em>around Bargara.</em></h2></div>
      <a class="btn btn--line" data-reveal href="gallery.html">Full gallery</a>
    </div>
    <div class="gal">
      ${[['w03', 'g1', 'A wide back lawn mown in even stripes behind a home'],
         ['w06', 'g2', 'Curved concrete paths running through a mown front lawn'],
         ['w09', 'g3', 'A shaped shrub bed topped with mulch beside a driveway'],
         ['w27', 'g4', 'A tandem trailer loaded high with cut branches and garden waste']]
        .map(([n, c, a]) => `<figure class="${c}" data-reveal><span class="tag">Real job</span>${pic(n, { alt: a, sizes: '(max-width:980px) 50vw, 40vw', ratio: 4 / 3 })}</figure>`).join('\n      ')}
    </div>
  </div>
</section>

${faqBlock(FAQ_HOME, { h2: 'Questions people <em>ask first.</em>', lead: `Not covered here? Call or text on <a href="${BIZ.phoneHref}">${BIZ.phone}</a>.` })}

${bigcta({ img: 'cta-home', alt: 'A wide mown lawn in even stripes with palms along the back fence',
  h: 'Get your weekend <em>back.</em>',
  sub: 'A free on-site quote, a fair price, and a yard that is finished properly before they drive off.' })}`,
});

/* ── About ───────────────────────────────────────────────────────────────── */
pages['about.html'] = page({
  file: 'about.html',
  title: `About Leo & Chantel | ${BIZ.name}`,
  description: `Thomson & Foley is Leo and Chantel, a two-person lawn and garden business working across ${BIZ.area}. Rated 5.0 on Google and Facebook.`,
  head: preload('about-hero', '100vw'),
  schema: [localBusiness, crumbSchema('About', 'about.html')],
  body: `${pagehero({
    img: 'about-hero', alt: 'Curved concrete paths running through a mown front lawn', crumb: 'About',
    h1: 'Two people, <em>one standard.</em>',
    sub: `${BIZ.name} is Leo and Chantel, working across ${BIZ.area}.`,
    actions: QUOTE('btn--gold btn--lg', 'Get a free quote', true) + CALL('btn--ghost btn--lg'),
  })}

<section class="section" aria-labelledby="about-h">
  <div class="wrap split">
    <div class="split__media" data-reveal>${pic('about-split', { alt: 'A person on a stand-on mower cutting a lawn beside a cordyline palm', sizes: '(max-width:980px) 92vw, 44vw', ratio: 4 / 5 })}</div>
    <div class="split__body">
      <div class="srule" data-reveal></div>
      <span class="eyebrow" data-reveal>The business</span>
      <h2 class="h2" id="about-h" data-reveal>The people who <em>actually turn up.</em></h2>
      <p class="lead" data-reveal>Leo and Chantel run Thomson &amp; Foley themselves. They quote the job, they do the job, and they are the ones you call if anything needs sorting. Customers name them both in their reviews, which is what happens when the same two people keep coming back.</p>
      <p class="lead" data-reveal>What they advertise is what they do: all lawn care and gardening services, with a high quality finish. Mowing, full garden tidy-ups, tree pruning, hedge trimming, green waste removals, mulch installs and light landscaping, plus vacant block and acreage mowing when a place has been left a while.</p>
      <ul class="ticks" data-reveal>
        <li>Quotes given on site, free and with no pressure</li>
        <li>Communication before and during the job</li>
        <li>Green waste loaded and taken away, not left in a pile</li>
        <li>The job area left in good condition on completion</li>
      </ul>
      ${QUOTE('btn--dark', 'Get a free quote', true).replace('<a class', '<a data-reveal class')}
    </div>
  </div>
</section>

<section class="section pt0" aria-labelledby="themes-h">
  <div class="wrap">
    <div class="srule srule--c" data-reveal></div>
    <div class="center center--wide">
      <span class="eyebrow" data-reveal>Straight from the reviews</span>
      <h2 class="h2" id="themes-h" data-reveal>What people keep <em>saying about them.</em></h2>
      <p class="lead" data-reveal style="margin-inline:auto">These are the themes that come up again and again in their reviews.</p>
    </div>
    <div class="vcards">
      ${[['clock', 'Prompt and punctual', 'Quick to reply to a message, and there when they say they will be. Several customers mention being fitted in at short notice.'],
         ['sparkle', 'Particular about the finish', 'Edges run out, sticks and leaves raked from the beds, paths cleared down. The tidy-up at the end is the part people write about.'],
         ['tag', 'Fair on price', 'Quotes come back reasonable and are explained up front, and the price stands. Nobody has to chase a surprise afterwards.']]
        .map(([ic, h, p]) => `<article class="vcard" data-reveal><span class="vcard__ic">${ICON[ic]}</span><h3>${h}</h3><p>${p}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>

${featureBand({
  img: 'about-band', alt: 'A cleared side yard beside a timber fence with bins moved back into place',
  h2: 'How a job <em>usually runs.</em>',
  lead: 'No forms, no sales visit, no waiting a week to hear back.',
  extra: `<ol class="steps steps--light" data-reveal>${STEPS.map(([n, h, p]) =>
    `<li class="step"><span class="step__n">${n}</span><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>`,
})}

<section class="section" aria-labelledby="areas-h">
  <div class="wrap">
    <div class="srule srule--c" data-reveal></div>
    <div class="center center--wide">
      <span class="eyebrow" data-reveal>Service area</span>
      <h2 class="h2" id="areas-h" data-reveal>Where they <em>work.</em></h2>
      <p class="lead" data-reveal style="margin-inline:auto">Based in Bargara and working across the Bundaberg region. Close by and not sure? Just ask.</p>
    </div>
    <ul class="arealist" data-reveal>${AREAS.map((a) => `<li>${a}</li>`).join('')}</ul>
  </div>
</section>

${bigcta({ img: 'cta-about', alt: 'A wide mown lawn in even stripes with palms along the back fence',
  h: 'Ready when <em>you are.</em>',
  sub: 'Call or text Thomson &amp; Foley and you will hear back quickly.' })}`,
});

/* ── Services ────────────────────────────────────────────────────────────── */
pages['services.html'] = page({
  file: 'services.html',
  title: `Services | Lawn Mowing, Pruning & Green Waste | ${BIZ.name}`,
  description: 'Lawn mowing and edging, garden tidy-ups, tree pruning, hedge trimming, green waste removal, mulch installs, light landscaping and acreage mowing across the Bundaberg region.',
  head: preload('services-hero', '100vw'),
  schema: [localBusiness, faqSchema(FAQ_SERVICES), crumbSchema('Services', 'services.html')],
  body: `${pagehero({
    img: 'services-hero', alt: 'A round garden bed of shaped shrubs and mulch beside a rendered wall', crumb: 'Services',
    h1: 'Everything a yard <em>needs, in one visit.</em>',
    sub: 'Eight services, quoted together and finished in the same visit, with the green waste taken away when they go.',
    actions: QUOTE('btn--gold btn--lg', 'Get a free quote', true) + CALL('btn--ghost btn--lg'),
  })}

<section class="section" aria-labelledby="all-h">
  <div class="wrap">
    <div class="srule" data-reveal></div>
    <div class="shead">
      <div><span class="eyebrow" data-reveal>The full list</span><h2 class="h2" id="all-h" data-reveal>All lawn care <em>and gardening services.</em></h2></div>
    </div>
    <ul class="jump" data-reveal aria-label="Jump to a service">
      ${SERVICES.map((s) => `<li><a href="#${s.id}"><i>${s.n}</i>${s.short}</a></li>`).join('\n      ')}
    </ul>
    <div class="srows">
      ${SERVICES.map((s) => `<article class="srow" id="${s.id}" data-reveal>
        <div class="srow__media">${pic(s.img, { alt: s.alt, sizes: '(max-width:980px) 92vw, 46vw', ratio: 4 / 3 })}</div>
        <div class="srow__body">
          <span class="srow__n">${s.n}</span>
          <h2>${s.title}</h2>
          <p class="lead">${s.lead}</p>
          <ul class="ticks">${s.ticks.map((t) => `<li>${t}</li>`).join('')}</ul>
          ${QUOTE('btn--dark', 'Get a free quote', true)}
        </div>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>

${featureBand({
  img: 'services-band', alt: 'A mown nature strip running along a kerb in front of homes',
  h2: 'Not sure which <em>one you need?</em>',
  lead: 'Most jobs are a mix. Describe the yard or send a photo and you will get one price for the lot, not a line item for every task.',
  actions: QUOTE('btn--gold btn--lg') + CALL('btn--ghost btn--lg'),
})}

${faqBlock(FAQ_SERVICES, { h2: 'Before you <em>book.</em>', lead: `Anything else, call or text on <a href="${BIZ.phoneHref}">${BIZ.phone}</a>.` })}

${bigcta({ img: 'cta-services', alt: 'A wide mown lawn in even stripes with palms along the back fence',
  h: 'Tell them what <em>the yard needs.</em>',
  sub: 'A free quote, a straight price, and the green waste gone when they go.' })}`,
});

/* ── Gallery ─────────────────────────────────────────────────────────────── */
pages['gallery.html'] = page({
  file: 'gallery.html',
  title: `Our Work | Lawn & Garden Photos, Bargara | ${BIZ.name}`,
  description: 'Photos of real lawns, garden beds, pruning jobs and clean-ups completed by Thomson & Foley around Bargara and the Bundaberg region.',
  head: preload('gallery-hero', '100vw'),
  schema: [localBusiness, crumbSchema('Our Work', 'gallery.html')],
  body: `${pagehero({
    img: 'gallery-hero', alt: 'A mown nature strip running along a kerb toward the road', crumb: 'Our Work',
    h1: 'Real yards, <em>real results.</em>',
    sub: 'Every photo below is a job Leo and Chantel finished around Bargara and the Bundaberg region.',
    actions: QUOTE('btn--gold btn--lg', 'Get a free quote', true) + CALL('btn--ghost btn--lg'),
  })}

<section class="section" aria-labelledby="gal-h">
  <div class="wrap">
    <div class="srule" data-reveal></div>
    <div class="shead">
      <div><span class="eyebrow" data-reveal>${GALLERY.length} photos</span><h2 class="h2" id="gal-h" data-reveal>Their own <em>work.</em></h2></div>
      <a class="btn btn--line" data-reveal href="contact.html">Get a free quote</a>
    </div>
    <div class="gfilters" role="group" aria-label="Filter photos">
      ${GALLERY_FILTERS.map(([k, l], i) => `<button class="gfilter" type="button" data-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join('\n      ')}
    </div>
    <p class="sr-only" data-gallery-count aria-live="polite"></p>
    <div class="masonry" data-gallery>
      ${GALLERY.map(([n, alt, tags]) => `<figure data-tags="${tags}" data-full="assets/img/${n}.jpg" data-reveal>
        <button class="shot" type="button" aria-label="Open larger: ${esc(alt)}">${pic('thumb/' + n, { alt, sizes: '(max-width:680px) 46vw, (max-width:1200px) 30vw, 23vw', ratio: 4 / 3 }).replace('assets/img/thumb/' + n + '.jpg', 'assets/img/thumb/' + n + '.jpg')}</button>
        <span class="tag">Real job</span>
      </figure>`).join('\n      ')}
    </div>
  </div>
</section>

<div class="lb" data-lightbox aria-hidden="true" role="dialog" aria-modal="true" aria-label="Photo viewer">
  <img src="" alt="">
  <button class="lb__btn lb__close" data-lb-close type="button" aria-label="Close">${ICON.x}</button>
  <button class="lb__btn lb__prev" data-lb-prev type="button" aria-label="Previous photo">${ICON.left}</button>
  <button class="lb__btn lb__next" data-lb-next type="button" aria-label="Next photo">${ICON.right}</button>
  <p class="lb__cap" data-lb-cap></p>
</div>

${featureBand({ plain: true,
  h2: 'Want yours <em>on this page?</em>',
  lead: 'A free on-site quote, a straight price, and the green waste gone when they go.',
  actions: QUOTE('btn--gold btn--lg') + CALL('btn--ghost btn--lg'),
})}`,
});

/* ── Reviews ─────────────────────────────────────────────────────────────── */
pages['reviews.html'] = page({
  file: 'reviews.html',
  title: `Reviews | Rated 5.0 in Bargara | ${BIZ.name}`,
  description: `Read all ${BIZ.reviewCount} Google reviews and Facebook recommendations for Thomson & Foley Property Maintenance, rated 5.0 across the Bundaberg region.`,
  head: preload('reviews-hero', '100vw'),
  schema: [localBusiness, crumbSchema('Reviews', 'reviews.html')],
  body: `${pagehero({
    img: 'reviews-hero', alt: 'A mown back lawn with a flowering frangipani in the corner', crumb: 'Reviews',
    h1: 'Rated 5.0 <em>by their neighbours.</em>',
    sub: 'Every review below is a real one, left by a real customer on Google or Facebook, word for word.',
    actions: QUOTE('btn--gold btn--lg', 'Get a free quote', true) + CALL('btn--ghost btn--lg'),
  })}

<section class="section" aria-labelledby="revs-h">
  <div class="wrap">
    <div class="srule srule--c" data-reveal></div>
    <div class="center center--wide">
      <span class="eyebrow" data-reveal>Google &amp; Facebook</span>
      <h2 class="h2" id="revs-h" data-reveal>Read them <em>where they were left.</em></h2>
      <p class="lead" data-reveal style="margin-inline:auto">Thomson &amp; Foley hold a perfect 5.0 rating on Google, and are recommended on Facebook too.</p>
    </div>
    <div class="ratingbox" data-reveal>
      <div class="ratingbox__score">
        <b>5.0</b>${STARS(5)}<small>${BIZ.reviewCount} reviews</small>
      </div>
      <div class="ratingbox__bars">
        ${[5, 4, 3, 2, 1].map((n) => `<div class="ratingbox__bar"><span>${n}★</span><i style="--v:${n === 5 ? 100 : 0}%"></i><span>${n === 5 ? BIZ.reviewCount : 0}</span></div>`).join('\n        ')}
      </div>
    </div>
    <div class="rbtns" data-reveal>
      <a class="btn btn--google" href="${BIZ.google}" target="_blank" rel="noopener">${ICON.google}Read our reviews on Google</a>
      <a class="btn btn--fb" href="${BIZ.facebook}" target="_blank" rel="noopener">${ICON.fb}Read our reviews on Facebook</a>
      ${CALL('btn--line')}
    </div>
    <div class="rmason">${REVIEWS.map(reviewCard).join('\n      ')}</div>
  </div>
</section>

${featureBand({ plain: true,
  h2: 'Want to be <em>the next one?</em>',
  lead: 'Free on-site quote, a straight price, and the green waste gone when they go.',
  actions: QUOTE('btn--gold btn--lg') + CALL('btn--ghost btn--lg'),
})}`,
});

/* ── Contact ─────────────────────────────────────────────────────────────── */
const SERVICE_OPTIONS = [...SERVICES.map((s) => s.title), 'Regular maintenance', 'Something else'];

pages['contact.html'] = page({
  file: 'contact.html',
  title: `Contact & Free Quote | ${BIZ.name}`,
  description: `Call or text ${BIZ.phone}, or request a free quote online. Thomson & Foley cover ${BIZ.area}.`,
  head: preload('contact-hero', '100vw'),
  schema: [localBusiness, crumbSchema('Contact', 'contact.html')],
  body: `${pagehero({
    img: 'contact-hero', alt: 'A driveway and garage in warm afternoon light beside a cut lawn', crumb: 'Contact',
    h1: 'Get a straight price, <em>fast.</em>',
    sub: `Call or text ${BIZ.phone}, or send the form and Thomson &amp; Foley will come back to you.`,
    actions: CALL('btn--gold btn--lg') + `<a class="btn btn--ghost btn--lg" href="#quote">Use the form ${ICON.arrow}</a>`,
  })}

<section class="section" id="quote" aria-labelledby="quote-h">
  <div class="wrap">
    <div class="srule srule--c" data-reveal></div>
    <div class="center"><span class="eyebrow" data-reveal>Free, no obligation</span><h2 class="h2" id="quote-h" data-reveal>Get your <em>free quote.</em></h2>
    <p class="lead" data-reveal style="margin-inline:auto">No pressure and no obligation, just a fair price for the job.</p></div>
    <div class="contact">
      <aside class="cinfo" data-reveal>
        <h2>Get in touch</h2>
        <p>Call or text for the quickest reply, or send the form and Leo or Chantel will get straight back to you.</p>
        <div class="cline"><a href="${BIZ.phoneHref}"><span class="ic">${ICON.phone}</span><div><small>Call or text</small><b>${BIZ.phone}</b></div></a></div>
        <div class="cline"><a href="mailto:${BIZ.email}"><span class="ic">${ICON.mail}</span><div><small>Email</small><b>${BIZ.email}</b></div></a></div>
        <div class="cline"><a href="${BIZ.facebook}" target="_blank" rel="noopener"><span class="ic">${ICON.fb}</span><div><small>Message</small><b>Thomson &amp; Foley on Facebook</b></div></a></div>
        <div class="cline"><span class="ic">${ICON.pin}</span><div><small>Working across</small><b>${BIZ.area}</b></div></div>
        <div class="cinfo__chips">${SERVICES.map((s) => `<span>${s.short}</span>`).join('')}</div>
        <p class="cinfo__note">Rated 5.0 on Google and Facebook by customers across the Bundaberg region.</p>
      </aside>

      <div class="cform" data-form data-reveal>
        <h2>Request a free quote</h2>
        <p class="cform__intro">A few details is all they need to give you a fair price.</p>
        <form novalidate ${BIZ.formEndpoint ? `data-endpoint="${BIZ.formEndpoint}"` : ''} data-mailto="mailto:${BIZ.email}" action="mailto:${BIZ.email}" method="post" enctype="text/plain">
          <input type="hidden" name="source" value="Website — ${esc(BIZ.name)}">
          <input type="hidden" name="ts" value="">
          <label class="field--hp" aria-hidden="true"><input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off">Leave this empty</label>
          <div class="frow">
            <div class="field"><label for="name">Your name <span class="req">*</span></label><input id="name" name="name" required autocomplete="name" placeholder="Jane Smith"><span class="err" aria-live="polite"></span></div>
            <div class="field"><label for="phone">Phone <span class="req">*</span></label><input id="phone" name="phone" type="tel" required autocomplete="tel" placeholder="0400 000 000"><span class="err" aria-live="polite"></span></div>
          </div>
          <div class="frow">
            <div class="field"><label for="email">Email (optional)</label><input id="email" name="email" type="email" autocomplete="email" placeholder="you@email.com"><span class="err" aria-live="polite"></span></div>
            <div class="field"><label for="suburb">Suburb</label><input id="suburb" name="suburb" autocomplete="address-level2" placeholder="Bargara"><span class="err" aria-live="polite"></span></div>
          </div>
          <div class="field"><label for="service">What do you need?</label>
            <select id="service" name="service">${SERVICE_OPTIONS.map((o) => `<option>${o}</option>`).join('')}</select>
          </div>
          <div class="field"><label for="message">A bit about the job</label>
            <textarea id="message" name="message" rows="4" placeholder="e.g. Fortnightly mow and edge on a standard block, plus a hedge trim and the clippings taken away."></textarea><span class="err" aria-live="polite"></span>
          </div>
          <button class="btn btn--gold btn--lg" type="submit">Send my request ${ICON.arrow}</button>
          <p class="cform__note" data-form-status aria-live="polite">No obligation. They usually reply quickly.</p>
        </form>
        <div class="cform__ok" role="status">
          <span class="ok-ic">${ICON.check}</span>
          <h3>Thanks, that is sent.</h3>
          <p>Leo or Chantel will get back to you shortly. If it is urgent, call or text ${BIZ.phone}.</p>
        </div>
      </div>
    </div>
  </div>
</section>

${bigcta({ img: 'contact-band', alt: 'A mown nature strip running along a kerb in front of homes',
  h: 'Prefer to <em>just call?</em>',
  sub: 'Happy to talk the job through and find a time that suits. No pressure, no obligation.' })}`,
});

/* ── 404 ─────────────────────────────────────────────────────────────────── */
pages['404.html'] = page({
  file: '404.html', noindex: true,
  title: `Page not found | ${BIZ.name}`,
  description: 'That page has moved or never existed.',
  schema: [],
  body: `<section class="hero pagehero">
  <div class="hero__media">${pic('cta-home', { alt: '', sizes: '100vw', eager: true, ratio: 4 / 3 })}</div>
  <div class="hero__shade"></div>
  <div class="hero__in"><div class="hero__copy">
    <h1 class="hero__h1">That page <em>has been cleared away.</em></h1>
    <p class="hero__sub">The link is wrong or the page has moved. The yard work is all still here.</p>
    <div class="hero__actions">
      <a class="btn btn--gold btn--lg" href="index.html">Back to home ${ICON.arrow}</a>
      ${CALL('btn--ghost btn--lg')}
    </div>
  </div></div>
</section>`,
});

/* ══════════════════════════════════════════════════════════════════════════
   WRITE
   ══════════════════════════════════════════════════════════════════════════ */
await mkdir(ROOT, { recursive: true });
for (const [file, html] of Object.entries(pages)) {
  await writeFile(path.join(ROOT, file), html);
}

const routes = ['', 'about.html', 'services.html', 'gallery.html', 'reviews.html', 'contact.html'];
await writeFile(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes.map((r) => `  <url><loc>${BIZ.origin}/${r}</loc><changefreq>monthly</changefreq><priority>${r === '' ? '1.0' : '0.8'}</priority></url>`).join('\n') +
  `\n</urlset>\n`);

await writeFile(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BIZ.origin}/sitemap.xml\n`);

await writeFile(path.join(ROOT, 'site.webmanifest'), JSON.stringify({
  name: BIZ.name, short_name: BIZ.short, start_url: '/', display: 'standalone',
  background_color: '#05150C', theme_color: '#05150C',
  icons: [{ src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2) + '\n');

console.log(`built ${Object.keys(pages).length} pages + sitemap, robots, manifest`);
