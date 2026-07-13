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

// ---------- Google Play store assets ----------
const PLAY = path.join(ROOT, 'assets', 'play');
fs.mkdirSync(PLAY, { recursive: true });
function playRender(svg, out) {
  const r = new Resvg(svg, { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' } });
  fs.writeFileSync(path.join(PLAY, out), r.render().asPng());
  console.log('wrote', 'play/' + out);
}

// Play high-res icon 512x512 — black tile + soft lime glow + wordmark (matches app icon).
playRender(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="#000"/>
  <defs><radialGradient id="g" cx="28%" cy="24%" r="75%">
    <stop offset="0%" stop-color="${LIME}" stop-opacity="0.16"/>
    <stop offset="45%" stop-color="${LIME}" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="${LIME}" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <text x="256" y="256" font-family="Inter ExtraBold" font-size="116" fill="#f7f7f9" text-anchor="middle" dominant-baseline="central" letter-spacing="-2.3">iClose<tspan fill="${LIME}">.</tspan></text>
</svg>`, 'icon-512.png');

// Feature graphic 1024x500 — required by Play, shown atop the listing.
playRender(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <rect width="1024" height="500" fill="#000"/>
  <defs><radialGradient id="g" cx="20%" cy="12%" r="95%">
    <stop offset="0%" stop-color="${LIME}" stop-opacity="0.16"/>
    <stop offset="50%" stop-color="${LIME}" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="${LIME}" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <text x="64" y="96" font-family="Inter ExtraBold" font-size="44" fill="#f5f5f7">iClose<tspan fill="${LIME}">.</tspan></text>
  <text x="60" y="240" font-family="Anton" font-size="92" fill="#f5f5f7">NEVER PAY</text>
  <text x="60" y="340" font-family="Anton" font-size="92" fill="${LIME}">COMMISSION.</text>
  <text x="64" y="420" font-family="Inter SemiBold" font-size="26" fill="#a1a1a6">The UAE's flat-fee way to buy property and close deals.</text>
</svg>`, 'feature-graphic-1024x500.png');

// Android notification small-icon — white silhouette on transparent (Android tints it).
playRender(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
  <text x="96" y="104" font-family="Inter ExtraBold" font-size="118" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="-4">iC</text>
</svg>`, 'notification-icon.png');
// Copy the notification icon where the app config expects it.
fs.copyFileSync(path.join(PLAY, 'notification-icon.png'), path.join(ROOT, 'assets', 'notification-icon.png'));
console.log('wrote assets/notification-icon.png');

console.log('done');
