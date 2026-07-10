# iClose — Brand & Landing Page Kit

Everything needed to build the iclose.ae landing page (Next.js) matching the app.

---

## 1. Colors

The system is **black-first with one loud accent**. Lime is scarce on purpose —
one primary action / one key number per section.

| Token        | Hex        | Use |
|--------------|------------|-----|
| `paper`      | `#000000`  | Page background (always black) |
| `surface`    | `#141416`  | Cards |
| `surface2`   | `#1f1f22`  | Raised wells: inputs, icon chips, secondary buttons |
| `hairline`   | `#2a2a2e`  | All borders/dividers (1px) |
| `ink`        | `#f5f5f7`  | Primary text |
| `graphite`   | `#a1a1a6`  | Secondary text |
| `graphite-l` | `#6e6e73`  | Tertiary text, placeholders |
| `accent`     | `#9eff00`  | THE lime: primary CTA fill, key numbers, active states, logo dot |
| `on-accent`  | `#0a0a0a`  | Text/icons **on** lime — never white on lime |
| `amber`      | `#fbbf24`  | "Pending" money states only |
| `danger`     | `#ff453a`  | Destructive only |

Background glow (gives the black life — use on hero + section breaks):
```css
background:
  radial-gradient(90% 70% at 22% 0%, rgba(158,255,0,0.14) 0%, rgba(158,255,0,0.04) 45%, transparent 100%),
  #000;
```

Rules: lime text on black is fine for numbers/links; body copy never lime.
Anything filled lime gets `#0a0a0a` foreground. Cards are `surface` +
1px `hairline`; never pure grey borders.

## 2. Typography

Two families, both on Google Fonts:

- **Anton** (400 only) — display headlines. ALWAYS uppercase, tight leading
  (0.95–1.05), letter-spacing ~ -0.01em. One lime word/line per headline.
- **Inter** — everything else. Weights: 400 body, 500/600 UI, 700 subheads,
  **800 for the wordmark and stat numbers**.

Next.js setup:
```ts
// app/fonts.ts
import { Anton, Inter } from 'next/font/google';
export const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' });
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

Scale (desktop → mobile): hero 96→48px Anton; section titles 56→36px Anton;
card titles 22px Inter 700; body 17px Inter 400 (#a1a1a6); eyebrow 14px
Inter 600 uppercase, letter-spacing 0.2em, lime.

**Wordmark**: styled text, not an image — `iClose` in Inter ExtraBold (800),
letter-spacing -0.02em, `#f5f5f7`, followed by a lime `.`
On light surfaces (emails): `#111113` + lime dot. Never outline, never gradient.

## 3. Tailwind config (drop-in)

```js
// tailwind.config.js (v3) — or @theme in v4
colors: {
  paper: '#000000',
  surface: { DEFAULT: '#141416', 2: '#1f1f22' },
  hairline: '#2a2a2e',
  ink: '#f5f5f7',
  graphite: { DEFAULT: '#a1a1a6', light: '#6e6e73' },
  accent: { DEFAULT: '#9eff00', hover: '#b3ff3d' },
  onaccent: '#0a0a0a',
},
borderRadius: { apple: '18px', card: '24px' },
fontFamily: {
  display: ['var(--font-anton)'],
  sans: ['var(--font-inter)'],
},
```

## 4. Component recipes

- **Primary CTA**: lime pill — `bg-accent text-onaccent rounded-full px-8 py-4
  font-semibold hover:bg-[#b3ff3d]`, optional glow `shadow-[0_0_40px_rgba(158,255,0,0.25)]`.
- **Secondary button**: `bg-surface-2 border border-hairline text-ink rounded-full`.
- **Card**: `bg-surface border border-hairline rounded-card p-6` (radius 24 web).
- **Chip / pill**: rounded-full; active = lime fill + dark text; inactive =
  `bg-surface-2 border-hairline text-ink`.
- **Stat**: number in Inter 800 (lime if it's the hero stat), label 14px graphite below.
- **Check bullet**: 22px lime circle + dark check icon (lucide `check`), text 17px ink.
- **Secure note**: small shield icon + 13px graphite — used under every form CTA.
- Icons: **lucide** (`lucide-react`), stroke 2, lime on dark wells / dark on lime.

## 5. Assets (in this kit / repo)

| File | Use |
|------|-----|
| `assets/web/logo-light.png` | Wordmark for dark bg (2x). Prefer live-text wordmark where possible |
| `assets/web/logo-dark.png`  | Wordmark for light bg (emails, invoices) |
| `assets/web/og-image.png`   | 1200×630 — `<meta property="og:image">` / Twitter card |
| `assets/web/phone-*.png`    | Headline-free iPhone mockups (home, calculator, inquiries, history, benefits) — hero/feature sections; they sit seamlessly on black |
| `assets/appstore/*-1290x2796.png` | Framed shots WITH Anton headlines — usable as marketing cards |
| `assets/icon.png`           | 1024 app icon (black + glow) — favicons/app badges |
| `assets/favicon.png`        | 256 favicon source |
| Higgsfield hero (interior): `https://d8j0ntlcm91z4.cloudfront.net/user_373qi3JTSvYmXjqMPJT9idOjFt7/hf_20260706_085947_7e47de9a-6de5-4c9f-945c-64add135c9ca.png` — if used, always fade to black at edges |

Regenerate any of these: `node scripts/gen-web-assets.js` / `node scripts/gen-appstore-shots.js`.

## 6. Copy bank

- **Master headline**: NEVER PAY **COMMISSION** AGAIN. *(lime word: COMMISSION or the last line)*
- **Broker headline**: SAVE **100%** OF YOUR COMMISSION.
- **Tagline**: The UAE's flat-fee way to buy property and close deals.
- **Promo line**: Buyers pay 0% commission. Brokers keep 100%. Submit in a minute, track every step — live to payout.

**Buyers card** — AED **8,250** conveyance fee — that's it.
• 0% commission on secondary real estate
• Up to 12% credit back on off-plan
*(fine print: off-plan credit available after signing the SPA)*

**Brokers card** — AED **3,500** admin fee — that's it.
• Keep 100% of your commission on secondary & off-plan deals
• Priority EOI booking
*(fine print: priority EOI exclusive to select developers)*

**How it works (4 steps)**: 1. Tell us what you want → 2. Our team works it
with you on WhatsApp or call → 3. Track every step live in the app →
4. Close & get paid — zero commission lost.

**CTAs**: "Get the app" / "Submit your first inquiry" / "Talk to us on WhatsApp".
**Trust line**: Your details are encrypted & visible only to our team.
**Footer links**: Privacy Policy · Terms · hello@iclose.ae · WhatsApp +971 58 553 0429

Voice: confident, short sentences, numbers do the talking. Never "cheap" —
always "flat fee / keep / save". Buyers hear "never pay commission";
brokers hear "keep/save 100%" — don't cross the streams.

## 7. Landing page structure (suggested)

1. **Hero**: black + glow, eyebrow, Anton headline, tagline, lime CTA +
   App Store badge, `phone-home.png` right (parallax/tilt optional).
2. **Fee cards**: Buyers / Brokers side by side (lime-tinted broker card:
   `rgba(158,255,0,0.07)` fill + `rgba(158,255,0,0.3)` border).
3. **How it works**: 4 steps with lucide icons in `surface2` wells.
4. **Calculator teaser**: `phone-calculator.png` + "Know your cut. Instantly."
5. **Product strip**: remaining phone shots in a horizontal scroll.
6. **FAQ** (accordion) → **final CTA** → footer.

Micro-interactions: 150–250ms ease-out, hover lift `translateY(-2px)`,
subtle stagger on scroll-in — restrained, like the app.
