/* Web/landing assets: wordmark logo renders + social OG image.
 * Run: node scripts/gen-web-assets.js  → assets/web/ */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'web');
fs.mkdirSync(OUT, { recursive: true });

const FONT_FILES = [
  'node_modules/@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf',
  'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
  'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
  'node_modules/@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf',
].map((p) => path.join(ROOT, p));

const LIME = '#9eff00';

function render(svg, out) {
  const r = new Resvg(svg, { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' } });
  fs.writeFileSync(path.join(OUT, out), r.render().asPng());
  console.log('wrote', out);
}

// Wordmark logos (2x for retina). Transparent background variants.
function logo({ w, h, size, ink, file }) {
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="${w / 2}" y="${h / 2}" font-family="Inter ExtraBold" font-size="${size}" fill="${ink}" text-anchor="middle" dominant-baseline="central" letter-spacing="${-size * 0.02}">iClose<tspan fill="${LIME}">.</tspan></text>
  </svg>`, file);
}
logo({ w: 1200, h: 320, size: 220, ink: '#f5f5f7', file: 'logo-light.png' });   // for dark backgrounds
logo({ w: 1200, h: 320, size: 220, ink: '#111113', file: 'logo-dark.png' });    // for light backgrounds

// OG image 1200x630 — black, lime glow, Anton headline.
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#000"/>
  <defs>
    <radialGradient id="g" cx="22%" cy="10%" r="90%">
      <stop offset="0%" stop-color="${LIME}" stop-opacity="0.16"/>
      <stop offset="50%" stop-color="${LIME}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${LIME}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="80" y="130" font-family="Inter ExtraBold" font-size="54" fill="#f5f5f7">iClose<tspan fill="${LIME}">.</tspan></text>
  <text x="76" y="300" font-family="Anton" font-size="110" fill="#f5f5f7">NEVER PAY</text>
  <text x="76" y="420" font-family="Anton" font-size="110" fill="${LIME}">COMMISSION AGAIN.</text>
  <text x="80" y="510" font-family="Inter SemiBold" font-size="30" fill="#a1a1a6">The UAE's flat-fee way to buy property and close deals.</text>
  <text x="80" y="566" font-family="Inter SemiBold" font-size="26" fill="#6e6e73">iclose.ae</text>
</svg>`, 'og-image.png');

console.log('done');
