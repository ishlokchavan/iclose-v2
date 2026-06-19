# iClose — Native App (Expo / React Native)

A genuine native iOS + Android app for the iClose `/experience`. The screens are
native (not a WebView): native navigation, gestures, a snap-paging discovery
feed, native maps, haptics, and Supabase auth. It talks to your **existing**
Next.js backend — the `/api/glass/*` routes and Supabase project are reused as-is.

## Architecture

```
Native app (this repo)              Your existing backend (closehq, deployed)
─────────────────────               ─────────────────────────────────────────
Expo Router screens        ──GET──▶ /api/glass/listings   (feed data)
NativeWind (your tokens)   ─POST──▶ /api/glass/why         (AI "why it fits")
Reanimated / gestures      ─POST──▶ /api/glass/search-parse
Supabase JS (AsyncStorage) ◀─────▶ Supabase  (auth + analytics)
Instant seed → live upgrade
```

The feed paints instantly from bundled seed data, then upgrades to live
listings — same instant-render strategy as the web `ExperienceProvider`, so it
also works offline.

## What's built

- **Home** — full-screen, snap-paging discovery feed (the flagship), save + haptics
- **Trending** — listings ranked by credits-back
- **Search** — instant client filtering + chips (NL parse via `/api/glass/search-parse` wired)
- **Map** — native map with listing pins (`react-native-maps`)
- **Profile** — Supabase email + native Google OAuth, saved count, sign out
- **Property detail** — image gallery, facts, AI "why this fits", sticky enquire CTA
- **Launches** + **Sell** modals
- Design tokens, types, API client, Supabase client, saved store — all ported from web

## Roadmap (next passes)

Video tours in the feed, the full Tinder-style swipe deck, developer pages,
listing-create form wired to `/api/listing`, analytics events
(`discovery_events` / `discovery_affinity`), push notifications.

## Prerequisites

- **Node 18+**
- **Quick preview:** the Expo Go app on your phone (most screens)
- **Full features (maps) + store builds:** a *development build*. For iOS builds
  without a Mac, use **EAS Build** (cloud). With a Mac, Xcode works locally.
  Android needs Android Studio or EAS.
- To publish: **Apple Developer** account ($99/yr) and **Google Play** ($25 once).

## Setup

```bash
npm install
npx expo install --fix        # aligns native deps to your installed Expo SDK
cp .env.example .env           # then fill in the values below
```

Fill `.env`:
- `EXPO_PUBLIC_API_BASE_URL` — your deployed site, e.g. `https://iclose.ae`
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same as the web app
- `GOOGLE_MAPS_API_KEY` — an Android-enabled Google Maps key (iOS uses Apple Maps)

> Native apps don't enforce browser CORS, so the cross-origin calls to
> `/api/glass/*` work without any backend CORS changes.

## Run

```bash
# Quick UI preview (no maps): Expo Go
npx expo start            # scan the QR with Expo Go

# Full development build (includes maps, blur, haptics):
npx expo run:ios          # needs a Mac + Xcode
npx expo run:android      # needs Android Studio
# …or build the dev client in the cloud:
npx eas build --profile development --platform ios   # / android
```

## Supabase auth config (one-time)

In the Supabase dashboard → **Authentication → URL Configuration**, add to
**Redirect URLs**:

```
iclose://auth-callback
exp://*            # optional: lets OAuth work in Expo Go during dev
```

Enable the **Google** provider (same client you use on web). Email/password
works with no extra config.

## Build for the stores

```bash
npm i -g eas-cli && eas login
eas build:configure
eas build --profile production --platform ios       # produces an .ipa
eas build --profile production --platform android    # produces an .aab
eas submit --platform ios       # uploads to App Store Connect
eas submit --platform android    # uploads to Play Console
```

Replace the placeholder icons in `assets/` with real iClose artwork derived from
`public/logo.svg` (1024×1024 `icon.png`, `adaptive-icon.png`, and `splash.png`).
`npx expo-asset` or any 1024px export works.

## Notes

- This scaffold was authored against **Expo SDK 53** conventions and could not be
  compiled in the authoring sandbox — run `npx expo install --fix` and
  `npm run typecheck` first; if your CLI installs a newer SDK, the native
  versions will reconcile automatically.
- `app.config.ts` reads everything from env/`extra`, so no secrets are committed.
