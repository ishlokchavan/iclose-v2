/* App Store screenshot generator — recreates key screens as crisp vector
 * mockups inside a device frame with Anton marketing headlines.
 * Run: node scripts/gen-appstore-shots.js
 * Outputs assets/appstore/{name}-{W}x{H}.png for 1290x2796 and 1320x2868. */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'appstore');
fs.mkdirSync(OUT, { recursive: true });

// ---------- fonts ----------
const FONT_FILES = [
  'node_modules/@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf',
  'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
  'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
  'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
  'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
  'node_modules/@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf',
].map((p) => path.join(ROOT, p)); // resvg-js 2.x wants fontFiles (paths), not buffers
// Google static-font family names (one family per weight file).
const F = { anton: 'Anton', reg: 'Inter', med: 'Inter Medium', semi: 'Inter SemiBold', bold: 'Inter Bold', xbold: 'Inter ExtraBold' };

// ---------- colors ----------
const C = {
  bg: '#000000', surface: '#141416', surface2: '#1f1f22', hairline: '#2a2a2e',
  ink: '#f5f5f7', graphite: '#a1a1a6', graphiteL: '#6e6e73',
  lime: '#9eff00', onLime: '#0a0a0a', amber: '#fbbf24', frame: '#303036', frameFill: '#0c0c0e',
};

// ---------- lucide icon loader ----------
const iconCache = {};
function icon(name, { x, y, size, color, sw = 2 }) {
  if (!iconCache[name]) {
    const file = path.join(ROOT, 'node_modules/lucide-react-native/dist/esm/icons', `${name}.mjs`);
    const src = fs.readFileSync(file, 'utf8');
    const m = src.match(/createLucideIcon\("[^"]+",\s*(\[[\s\S]*?\])\s*\);/);
    // eslint-disable-next-line no-eval
    iconCache[name] = eval(m[1]);
  }
  const s = size / 24;
  const els = iconCache[name].map(([tag, a]) => {
    if (tag === 'path') return `<path d="${a.d}"/>`;
    if (tag === 'circle') return `<circle cx="${a.cx}" cy="${a.cy}" r="${a.r}"/>`;
    if (tag === 'line') return `<line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}"/>`;
    if (tag === 'polyline') return `<polyline points="${a.points}"/>`;
    if (tag === 'rect') return `<rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" rx="${a.rx ?? 0}"/>`;
    return '';
  }).join('');
  return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${els}</g>`;
}

// ---------- svg helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function text(str, x, y, { size, fam = F.reg, color = C.ink, anchor = 'start', ls = 0 }) {
  return `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" fill="${color}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ''}>${esc(str)}</text>`;
}
const rect = (x, y, w, h, r, fill, stroke) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2"` : ''}/>`;
const circle = (cx, cy, r, fill, stroke) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2"` : ''}/>`;

// Wordmark: "iClose" ink + lime dot
function wordmark(x, y, size, inkColor = C.ink) {
  return `<text x="${x}" y="${y}" font-family="${F.xbold}" font-size="${size}" fill="${inkColor}">iClose<tspan fill="${C.lime}">.</tspan></text>`;
}

// ---------- screen chrome (drawn inside device screen coords) ----------
function statusBar(sx, sw) {
  const y = 96;
  const right = sx + sw - 74;
  let s = text('9:41', sx + 92, y + 14, { size: 44, fam: F.semi });
  // signal bars
  for (let i = 0; i < 4; i++) s += rect(right - 218 + i * 17, y - 8 - i * 7, 11, 14 + i * 7, 3, C.ink);
  // wifi
  s += icon('wifi', { x: right - 138, y: y - 26, size: 48, color: C.ink, sw: 2.6 });
  // battery
  s += rect(right - 72, y - 20, 62, 32, 9, 'none', C.graphiteL);
  s += rect(right - 66, y - 14, 42, 20, 5, C.ink);
  s += rect(right - 6, y - 7, 5, 12, 2, C.graphiteL);
  return s;
}

function tabBar(sx, sy, sw, sh, active) {
  const bw = sw - 72, bx = sx + 36, bh = 150, by = sy + sh - bh - 44;
  const items = [
    ['house', 'Home'], ['clipboard-list', 'Inquiries'], null, ['history', 'History'], ['user', 'Account'],
  ];
  let s = rect(bx, by, bw, bh, 62, 'rgba(20,20,22,0.94)', 'rgba(255,255,255,0.08)');
  const cell = bw / 5;
  items.forEach((it, i) => {
    const cx = bx + cell * i + cell / 2;
    if (!it) {
      s += circle(cx, by + bh / 2, 52, C.lime);
      s += icon('plus', { x: cx - 26, y: by + bh / 2 - 26, size: 52, color: C.onLime, sw: 2.6 });
      return;
    }
    const on = it[1] === active;
    const col = on ? C.lime : C.graphiteL;
    s += icon(it[0], { x: cx - 23, y: by + 26, size: 46, color: col, sw: on ? 2.4 : 2 });
    s += text(it[1], cx, by + 118, { size: 24, fam: F.semi, color: col, anchor: 'middle' });
  });
  return s;
}

// ---------- shot scaffold ----------
function shot({ W, H, eyebrow, line1, line2, limeWord, screen }) {
  // headline block
  const hx = W / 2;
  const headSize = W * 0.088;
  let head = text(eyebrow, hx, H * 0.062, { size: W * 0.0245, fam: F.semi, color: C.lime, anchor: 'middle', ls: W * 0.006 });
  const mk = (line, y) => {
    if (limeWord && line.includes(limeWord)) {
      const [a, b] = line.split(limeWord);
      return `<text x="${hx}" y="${y}" font-family="${F.anton}" font-size="${headSize}" fill="${C.ink}" text-anchor="middle">${esc(a)}<tspan fill="${C.lime}">${esc(limeWord)}</tspan>${esc(b)}</text>`;
    }
    return text(line, hx, y, { size: headSize, fam: F.anton, anchor: 'middle' });
  };
  head += mk(line1, H * 0.062 + headSize * 1.25);
  if (line2) head += mk(line2, H * 0.062 + headSize * 2.35);

  // device frame
  const fw = W * 0.782, fh = fw * 2.176, fx = (W - fw) / 2, fy = H * 0.196;
  const inset = fw * 0.021;
  const sxx = fx + inset, syy = fy + inset, sw = fw - inset * 2, sh = fh - inset * 2;
  let dev = rect(fx - 5, fy - 5, fw + 10, fh + 10, fw * 0.152, 'none', C.frame);
  dev += rect(fx, fy, fw, fh, fw * 0.148, C.frameFill);
  dev += rect(sxx, syy, sw, sh, fw * 0.128, C.bg);
  // dynamic island
  dev += rect(sxx + sw / 2 - sw * 0.145, syy + 26, sw * 0.29, 82, 41, '#0a0a0a', 'rgba(255,255,255,0.05)');

  const body = screen({ sx: sxx, sy: syy, sw, sh });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <defs>
    <radialGradient id="glow" cx="30%" cy="12%" r="80%">
      <stop offset="0%" stop-color="${C.lime}" stop-opacity="0.14"/>
      <stop offset="45%" stop-color="${C.lime}" stop-opacity="0.035"/>
      <stop offset="100%" stop-color="${C.lime}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="scr"><rect x="${sxx}" y="${syy}" width="${sw}" height="${sh}" rx="${fw * 0.128}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${head}
  ${dev}
  <g clip-path="url(#scr)">${statusBar(sxx, sw)}${body}</g>
</svg>`;
}

// ---------- shared screen pieces ----------
function chip(x, y, label, on, w) {
  const width = w ?? label.length * 17 + 64;
  let s = rect(x, y, width, 72, 36, on ? C.lime : C.surface2, on ? null : C.hairline);
  s += text(label, x + width / 2, y + 46, { size: 28, fam: F.semi, color: on ? C.onLime : C.ink, anchor: 'middle' });
  return { svg: s, w: width };
}
function badge(x, y, label, color, bg) {
  const w = label.length * 14.5 + 44;
  return rect(x, y, w, 52, 26, bg) + text(label, x + w / 2, y + 35, { size: 25, fam: F.semi, color, anchor: 'middle' });
}

// ================= SCREENS =================
function homeScreen({ sx, sy, sw, sh }) {
  const P = 44, x = sx + P, wIn = sw - P * 2;
  let y = sy + 200;
  let s = wordmark(x, y, 56);
  s += circle(sx + sw - P - 150, y - 18, 42, C.surface2, C.hairline);
  s += icon('bell', { x: sx + sw - P - 170, y: y - 38, size: 40, color: C.ink, sw: 2.2 });
  s += circle(sx + sw - P - 44, y - 18, 42, C.lime);
  s += text('J', sx + sw - P - 44, y - 3, { size: 36, fam: F.semi, color: C.onLime, anchor: 'middle' });
  y += 108;
  s += text('Hi John', x, y, { size: 64, fam: F.bold });
  y += 56;
  s += text('Track your deals and commission.', x, y, { size: 32, color: C.graphite });
  // hero card
  y += 44;
  s += rect(x, y, wIn, 300, 44, C.surface, C.hairline);
  s += icon('trending-up', { x: x + 40, y: y + 46, size: 34, color: C.lime, sw: 2.4 });
  s += text('Commission earned', x + 90, y + 74, { size: 29, fam: F.med, color: C.graphite });
  s += text('AED 160,000', x + 40, y + 182, { size: 84, fam: F.xbold, color: C.lime });
  s += text('Paid out to you', x + 40, y + 250, { size: 28, color: C.graphite });
  // pipeline card
  y += 340;
  s += rect(x, y, wIn, 320, 40, C.surface, C.hairline);
  s += text('Your pipeline', x + 40, y + 62, { size: 29, fam: F.semi, color: C.graphite });
  const bars = [['2', 'Submitted', C.graphiteL, 96], ['2', 'Discussing', C.graphite, 120], ['2', 'Closed', C.lime, 150]];
  bars.forEach((b, i) => {
    const bx = x + wIn * (0.18 + 0.32 * i);
    s += text(b[0], bx, y + 128, { size: 30, fam: F.bold, anchor: 'middle' });
    s += rect(bx - 32, y + 296 - 8 - b[3], 64, b[3], 18, b[2]);
    s += text(b[1], bx, y + 306, { size: 25, color: C.graphite, anchor: 'middle' });
  });
  // CTA
  y += 360;
  s += rect(x, y, wIn, 168, 40, C.lime);
  s += circle(x + 86, y + 84, 46, 'rgba(0,0,0,0.1)');
  s += icon('plus', { x: x + 62, y: y + 60, size: 48, color: C.onLime, sw: 2.4 });
  s += text('New deal inquiry', x + 160, y + 74, { size: 33, fam: F.semi, color: C.onLime });
  s += text('Tell us what you want — we take it from there.', x + 160, y + 122, { size: 26, color: 'rgba(10,10,10,0.65)' });
  s += icon('chevron-right', { x: x + wIn - 76, y: y + 62, size: 44, color: 'rgba(10,10,10,0.55)', sw: 2.2 });
  // manager card
  y += 208;
  s += rect(x, y, wIn, 316, 40, C.surface, C.hairline);
  s += text('ACCOUNT MANAGER', x + 40, y + 60, { size: 23, fam: F.semi, color: C.graphiteL, ls: 3 });
  s += circle(x + 92, y + 150, 52, C.surface2, C.hairline);
  s += text('SM', x + 92, y + 163, { size: 34, fam: F.semi, color: C.lime, anchor: 'middle' });
  s += text('Sara Malik', x + 170, y + 140, { size: 34, fam: F.semi });
  s += circle(x + 178, y + 180, 7, C.lime);
  s += text('Available now', x + 196, y + 190, { size: 26, fam: F.med, color: C.graphite });
  const half = (wIn - 80 - 24) / 2;
  s += rect(x + 40, y + 226, half, 66, 33, C.lime);
  s += icon('message-circle', { x: x + 40 + half / 2 - 92, y: y + 226 + 15, size: 36, color: C.onLime, sw: 2.2 });
  s += text('WhatsApp', x + 40 + half / 2 + 22, y + 226 + 45, { size: 28, fam: F.semi, color: C.onLime, anchor: 'middle' });
  s += rect(x + 64 + half, y + 226, half, 66, 33, C.surface2, C.hairline);
  s += icon('phone', { x: x + 64 + half + half / 2 - 62, y: y + 226 + 16, size: 34, color: C.ink, sw: 2 });
  s += text('Call', x + 64 + half + half / 2 + 20, y + 226 + 45, { size: 28, fam: F.semi, anchor: 'middle' });
  return s + tabBar(sx, sy, sw, sh, 'Home');
}

function calcScreen({ sx, sy, sw, sh }) {
  const P = 44, x = sx + P, wIn = sw - P * 2;
  let y = sy + 210;
  let s = text('New deal inquiry', x, y, { size: 52, fam: F.bold });
  s += icon('x', { x: sx + sw - P - 46, y: y - 40, size: 46, color: C.ink, sw: 2.2 });
  y += 84;
  s += text('Property status', x, y, { size: 30, fam: F.med, color: C.graphite });
  y += 36;
  const segW = (wIn - 24) / 2;
  s += rect(x, y, segW, 108, 34, C.surface2, C.hairline);
  s += icon('key-round', { x: x + segW / 2 - 148, y: y + 32, size: 40, color: C.graphite, sw: 2 });
  s += text('Ready / Secondary', x + segW / 2 + 24, y + 66, { size: 29, fam: F.semi, anchor: 'middle' });
  s += rect(x + segW + 24, y, segW, 108, 34, C.lime);
  s += icon('hard-hat', { x: x + segW + 24 + segW / 2 - 110, y: y + 32, size: 40, color: C.onLime, sw: 2 });
  s += text('Off-plan', x + segW + 24 + segW / 2 + 26, y + 66, { size: 30, fam: F.semi, color: C.onLime, anchor: 'middle' });
  y += 160;
  s += text('Deal value', x, y, { size: 30, fam: F.med, color: C.graphite });
  y += 36;
  s += rect(x, y, wIn, 118, 34, C.surface2, C.hairline);
  s += text('AED', x + 40, y + 74, { size: 34, fam: F.med, color: C.graphiteL });
  s += text('2,000,000', x + 130, y + 76, { size: 42, fam: F.semi });
  y += 150;
  let cx = x;
  ['500K', '1M', '2M', '5M', '10M'].forEach((c) => { const r = chip(cx, y, c, false); s += r.svg; cx += r.w + 18; });
  // calc card
  y += 120;
  s += rect(x, y, wIn, 320, 44, 'rgba(158,255,0,0.08)', 'rgba(158,255,0,0.35)');
  s += icon('wallet', { x: x + 40, y: y + 42, size: 40, color: C.lime, sw: 2.2 });
  s += text('You keep (5% off-plan)', x + 100, y + 72, { size: 30, fam: F.med, color: C.graphite });
  s += text('AED 96,500', x + 40, y + 190, { size: 92, fam: F.xbold, color: C.lime });
  s += text('AED 100,000 commission − AED 3,500 admin fee', x + 40, y + 262, { size: 27, color: C.graphite });
  y += 356;
  s += icon('info', { x: x + 4, y: y - 2, size: 30, color: C.graphiteL, sw: 2 });
  s += text('Example estimate at 5% commission (off-plan).', x + 48, y + 22, { size: 26, color: C.graphiteL });
  s += text('Actual terms are confirmed by our team.', x + 48, y + 60, { size: 26, color: C.graphiteL });
  // submit
  y += 130;
  s += rect(x, y, wIn, 130, 65, C.lime);
  s += text('Submit & send on WhatsApp', x + wIn / 2, y + 80, { size: 36, fam: F.semi, color: C.onLime, anchor: 'middle' });
  y += 176;
  // left-anchored icon + text as one centered group (icon must not overlap text)
  const note = 'Your inquiry is private — only our team sees it.';
  const noteW = note.length * 12.6 + 44;
  const nx = x + wIn / 2 - noteW / 2;
  s += icon('shield-check', { x: nx, y: y - 24, size: 30, color: C.graphite, sw: 2 });
  s += text(note, nx + 44, y, { size: 26, color: C.graphite });
  return s;
}

function inquiriesScreen({ sx, sy, sw, sh }) {
  const P = 44, x = sx + P, wIn = sw - P * 2;
  let y = sy + 210;
  let s = text('Inquiries', x, y, { size: 60, fam: F.bold });
  y += 60;
  s += rect(x, y, wIn - 104, 96, 48, C.surface, C.hairline);
  s += icon('search', { x: x + 36, y: y + 28, size: 38, color: C.graphiteL, sw: 2.2 });
  s += text('Search by name, area, ref…', x + 92, y + 60, { size: 29, color: C.graphiteL });
  s += circle(x + wIn - 48, y + 48, 48, C.surface2, C.hairline);
  s += icon('sliders-horizontal', { x: x + wIn - 68, y: y + 28, size: 40, color: C.ink, sw: 2.2 });
  y += 130;
  let cx = x;
  [['All', true], ['Submitted', false], ['In discussion', false]].forEach(([l, on]) => { const r = chip(cx, y, l, on); s += r.svg; cx += r.w + 18; });
  y += 128;
  s += text('MON 6 JUL', x, y, { size: 26, fam: F.semi, color: C.graphite, ls: 2 });
  y += 28;
  const rows = [
    ['Emaar Beachfront', 'INQ-418840 · Dubai · Dubai Marina', 'Submitted', C.amber, 'rgba(245,158,11,0.16)', 'AED 2,500,000'],
    ['Damac Hills 2', 'INQ-0C973D · Dubai · Dubailand', 'In discussion', C.lime, 'rgba(158,255,0,0.16)', 'AED 1,800,000'],
    ['Referral — Business Bay', 'INQ-826977 · Dubai · Business Bay', 'In discussion', C.lime, 'rgba(158,255,0,0.16)', 'AED 1,600,000'],
  ];
  rows.forEach((r) => {
    s += rect(x, y, wIn, 240, 40, C.surface, C.hairline);
    s += text(r[0], x + 40, y + 74, { size: 36, fam: F.semi });
    s += text('6 Jul 2026', x + wIn - 40, y + 70, { size: 26, color: C.graphiteL, anchor: 'end' });
    s += text(r[1], x + 40, y + 124, { size: 27, color: C.graphite });
    s += badge(x + 40, y + 156, r[2], r[3], r[4]);
    s += text(r[5], x + wIn - 40, y + 194, { size: 34, fam: F.bold, anchor: 'end' });
    y += 268;
  });
  return s + tabBar(sx, sy, sw, sh, 'Inquiries');
}

function historyScreen({ sx, sy, sw, sh }) {
  const P = 44, x = sx + P, wIn = sw - P * 2;
  let y = sy + 210;
  let s = text('History', x, y, { size: 60, fam: F.bold });
  y += 60;
  s += rect(x, y, wIn - 104, 96, 48, C.surface, C.hairline);
  s += icon('search', { x: x + 36, y: y + 28, size: 38, color: C.graphiteL, sw: 2.2 });
  s += text('Search transactions', x + 92, y + 60, { size: 29, color: C.graphiteL });
  s += circle(x + wIn - 48, y + 48, 48, C.surface2, C.hairline);
  s += icon('sliders-horizontal', { x: x + wIn - 68, y: y + 28, size: 40, color: C.ink, sw: 2.2 });
  // summary
  y += 140;
  s += rect(x, y, wIn, 360, 44, C.surface, C.hairline);
  s += text('Commission earned', x + 40, y + 70, { size: 29, color: C.graphite });
  s += text('AED 160,000', x + 40, y + 172, { size: 86, fam: F.xbold, color: C.lime });
  const cols = [['2', 'Deals closed', C.ink], ['AED 11,000,000', 'Total value', C.ink], ['AED 150,000', 'Pending', C.amber]];
  let ccx = x + 40;
  cols.forEach((c) => {
    s += text(c[0], ccx, y + 264, { size: 36, fam: F.bold, color: c[2] });
    s += text(c[1], ccx, y + 312, { size: 26, color: C.graphite });
    // advance by the wider of value / label so columns never collide
    ccx += Math.max(c[0].length * 22, c[1].length * 14.5) + 64;
  });
  y += 420;
  s += text('JULY 2026', x, y, { size: 27, fam: F.semi, color: C.graphite, ls: 2 });
  s += text('AED 1,510,000', x + wIn, y, { size: 30, fam: F.bold, anchor: 'end' });
  y += 30;
  s += rect(x, y, wIn, 3 * 158, 40, C.surface, C.hairline);
  const rows = [
    ['circle-check', C.lime, 'rgba(158,255,0,0.12)', 'Palm Jumeirah Villa', '6 Jul 2026 · Closed', 'AED 160,000'],
    ['circle-check', C.lime, 'rgba(158,255,0,0.12)', 'Sobha Hartland Tower', '6 Jul 2026 · Closed', 'AED 150,000'],
    ['circle-x', C.graphite, C.surface2, 'JLT Office', '6 Jul 2026 · Not closed', 'AED 1,200,000'],
  ];
  rows.forEach((r, i) => {
    const ry = y + i * 158;
    if (i > 0) s += `<line x1="${x + 36}" y1="${ry}" x2="${x + wIn - 36}" y2="${ry}" stroke="${C.hairline}" stroke-width="2"/>`;
    s += circle(x + 84, ry + 79, 42, r[2]);
    s += icon(r[0], { x: x + 62, y: ry + 57, size: 44, color: r[1], sw: 2 });
    s += text(r[3], x + 156, ry + 68, { size: 32, fam: F.semi });
    s += text(r[4], x + 156, ry + 114, { size: 26, color: C.graphite });
    s += text(r[5], x + wIn - 40, ry + 92, { size: 31, fam: F.bold, anchor: 'end' });
  });
  return s + tabBar(sx, sy, sw, sh, 'History');
}

function benefitsScreen({ sx, sy, sw, sh }) {
  const P = 44, x = sx + P, wIn = sw - P * 2;
  let y = sy + 220;
  let s = wordmark(x, y, 50);
  y += 92;
  s += text('One flat fee.', x, y, { size: 62, fam: F.bold });
  y += 72;
  s += text('Zero commission.', x, y, { size: 62, fam: F.bold, color: C.lime });
  // broker card
  y += 60;
  s += rect(x, y, wIn, 560, 48, 'rgba(158,255,0,0.07)', 'rgba(158,255,0,0.3)');
  s += icon('briefcase-business', { x: x + 44, y: y + 48, size: 46, color: C.lime, sw: 2.2 });
  s += text('Brokers', x + 116, y + 84, { size: 40, fam: F.bold });
  s += text('AED 3,500', x + 44, y + 208, { size: 96, fam: F.xbold, color: C.lime });
  s += text('admin fee — that’s it', x + 44, y + 264, { size: 29, color: C.graphite });
  const checks = [
    ['Save 100% of your commission on', 'secondary & off-plan deals'],
    ['Priority EOI booking', null],
  ];
  let cy = y + 330;
  checks.forEach((c) => {
    s += circle(x + 66, cy + 2, 26, C.lime);
    s += icon('check', { x: x + 52, y: cy - 12, size: 28, color: C.onLime, sw: 3 });
    s += text(c[0], x + 116, cy + 12, { size: 30, fam: F.med });
    if (c[1]) { cy += 46; s += text(c[1], x + 116, cy + 12, { size: 30, fam: F.med }); }
    cy += 74;
  });
  // buyer card
  y += 600;
  s += rect(x, y, wIn, 460, 48, C.surface, C.hairline);
  s += icon('shopping-bag', { x: x + 44, y: y + 48, size: 46, color: C.lime, sw: 2.2 });
  s += text('Buyers', x + 116, y + 84, { size: 40, fam: F.bold });
  s += text('AED 8,250', x + 44, y + 200, { size: 84, fam: F.xbold });
  s += text('conveyance fee — that’s it', x + 44, y + 254, { size: 29, color: C.graphite });
  const bch = [['0% commission on secondary real estate'], ['Up to 12% credit back on off-plan']];
  cy = y + 320;
  bch.forEach((c) => {
    s += circle(x + 66, cy + 2, 26, C.lime);
    s += icon('check', { x: x + 52, y: cy - 12, size: 28, color: C.onLime, sw: 3 });
    s += text(c[0], x + 116, cy + 12, { size: 30, fam: F.med });
    cy += 74;
  });
  return s;
}

// ================= RENDER =================
const SHOTS = [
  { name: '01-home', eyebrow: 'FOR BROKERS & BUYERS', line1: 'TRACK DEALS.', line2: 'GET PAID.', limeWord: 'GET PAID.', screen: homeScreen },
  { name: '02-calculator', eyebrow: 'LIVE COMMISSION CALCULATOR', line1: 'KNOW YOUR CUT.', line2: 'INSTANTLY.', limeWord: 'INSTANTLY.', screen: calcScreen },
  { name: '03-inquiries', eyebrow: 'REAL-TIME PIPELINE', line1: 'EVERY DEAL,', line2: 'TRACKED LIVE.', limeWord: 'TRACKED LIVE.', screen: inquiriesScreen },
  { name: '04-history', eyebrow: 'COMMISSION HISTORY', line1: 'PAYOUTS,', line2: 'CRYSTAL CLEAR.', limeWord: 'CRYSTAL CLEAR.', screen: historyScreen },
  { name: '05-benefits', eyebrow: 'WHY ICLOSE', line1: 'ONE FLAT FEE.', line2: 'ZERO COMMISSION.', limeWord: 'ZERO COMMISSION.', screen: benefitsScreen },
];

const SIZES = [[1290, 2796], [1320, 2868], [1284, 2778]];
for (const [W, H] of SIZES) {
  for (const sh of SHOTS) {
    const svg = shot({ W, H, ...sh });
    const r = new Resvg(svg, { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Inter' } });
    const out = path.join(OUT, `${sh.name}-${W}x${H}.png`);
    fs.writeFileSync(out, r.render().asPng());
    console.log('wrote', path.basename(out));
  }
}
console.log('done');
