/* ============================================================================
   Photo pipeline for site/assets/img
   ----------------------------------------------------------------------------
   Takes the full-size originals and emits AVIF at the widths the layout asks
   for, plus one progressive JPEG per photo as the universal fallback.

   There is deliberately no WebP tier: on photography this detailed WebP came
   out larger than mozjpeg at matched quality, so it cost bytes while serving
   its browsers worse than the fallback they would otherwise get.

   Requires sharp, which is not a dependency of this repo — it is only needed
   when the source photography changes:

     npm i --no-save sharp
     node tools/build-images.mjs <source-dir>

   <source-dir> holds the originals, mirroring the shape they arrive in:
     <source-dir>/*.jpg          hero / band / tile / service photos
     <source-dir>/thumb/wNN.jpg  gallery thumbnails
     <source-dir>/../logo.png    the wreath logo
   ========================================================================== */
import sharp from 'sharp';
import { readdir, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(process.argv[2] || 'photos');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const OUT = path.join(ROOT, 'assets', 'img');

/* Two axes set quality here.

   Role: a photo behind a heavy dark scrim survives far more compression than a
   tile a visitor actually studies.

   Tier: AVIF is what ~95% of visitors receive, so it carries the quality. The
   JPEG exists only for browsers that cannot take AVIF. */
const ROLES = {
  bleed: { widths: [960, 1440], jpg: 1100, avif: 42, jpgQ: 66 },      // hero / band / cta backdrops
  panel: { widths: [560, 900, 1200], jpg: 900, avif: 50, jpgQ: 70 },  // tiles, service rows, splits
  full:  { widths: [900, 1400], jpg: 1000, avif: 48, jpgQ: 68 },      // lightbox originals
  micro: { widths: [220, 440], jpg: 440, avif: 55, jpgQ: 76 },        // the hero rating thumbnail
};
const roleFor = (n) =>
  /^((home|about|services|gallery|reviews|contact)-(hero|band)|feature-home|cta-)/.test(n) ? 'bleed'
  : /^card-thumb/.test(n) ? 'micro'
  : /^w\d\d$/.test(n) ? 'full'
  : 'panel';

async function emit(file, name, role) {
  const cfg = ROLES[role];
  const meta = await sharp(file).metadata();
  for (const w of cfg.widths) {
    if (w > meta.width * 1.02) continue;
    await sharp(file).resize({ width: w, withoutEnlargement: true })
      .avif({ quality: cfg.avif, effort: 3 }).toFile(path.join(OUT, `${name}-${w}.avif`));
  }
  await sharp(file).resize({ width: Math.min(cfg.jpg, meta.width), withoutEnlargement: true })
    .jpeg({ quality: cfg.jpgQ, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${name}.jpg`));
}

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'thumb'), { recursive: true });

for (const f of (await readdir(SRC)).filter((f) => f.endsWith('.jpg'))) {
  const name = f.replace(/\.jpg$/, '');
  await emit(path.join(SRC, f), name, roleFor(name));
}
for (const f of (await readdir(path.join(SRC, 'thumb'))).filter((f) => f.endsWith('.jpg'))) {
  const name = f.replace(/\.jpg$/, '');
  const src = path.join(SRC, 'thumb', f);
  for (const w of [380, 640]) {
    await sharp(src).resize({ width: w, withoutEnlargement: true })
      .avif({ quality: 48, effort: 3 }).toFile(path.join(OUT, 'thumb', `${name}-${w}.avif`));
  }
  await sharp(src).resize({ width: 640 }).jpeg({ quality: 66, mozjpeg: true }).toFile(path.join(OUT, 'thumb', `${name}.jpg`));
}

/* Logo, icons and the social card. */
const LOGO = path.join(SRC, '..', 'logo.png');
const A = (f) => path.join(ROOT, 'assets', f);
await sharp(LOGO).resize({ width: 240 }).png({ compressionLevel: 9, palette: true }).toFile(A('logo.png'));
for (const [size, file, palette] of [[180, 'favicon.png', true], [512, 'icon-512.png', false]]) {
  await sharp(LOGO).resize({ width: size, height: size, fit: 'contain', background: { r: 5, g: 21, b: 12, alpha: 1 } })
    .png({ compressionLevel: 9, palette }).toFile(A(file));
}
// social card: cropped to the 1.91:1 ratio Facebook and X expect
await sharp(path.join(SRC, 'cta-home.jpg')).resize({ width: 1200, height: 630, fit: 'cover' })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(A('og-cover.jpg'));

console.log('images written to', OUT);
