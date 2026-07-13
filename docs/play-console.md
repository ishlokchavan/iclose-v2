# Google Play — iClose Android launch runbook

Package: `ae.iclose.app` · EAS project `329eea7c-...` · version 2.0.0

The Android build pipeline is already configured in `app.config.ts` + `eas.json`
(production profile builds a signed `.aab`, `submit.production.android` targets
the internal track). Below is everything from build → live.

---

## 0. Heads-up: the new-account testing requirement
If your Google Play **developer account is a personal account created after
Nov 2023**, Google requires **closed testing with at least 12 testers for 14
continuous days** before you can apply for production access. This is a Google
policy, not a technical blocker — plan for it. **Organization/company accounts
are exempt.** Check your account type first at play.google.com/console.

Strategy either way: ship to **Internal testing** first (instant, up to 100
testers, no review delay), validate, then promote to Closed → Production.

---

## 1. Firebase / FCM — required for Android push notifications
iOS push (APNs) is done. Android push needs Firebase Cloud Messaging. **Optional
for the first release** — the app builds and runs fine without it; only device
push won't fire until this is done (email + in-app notifications still work).

1. Firebase Console → create/select a project → **Add app → Android**.
2. Package name: `ae.iclose.app`. Download **`google-services.json`**.
3. Put it in the repo root (`/google-services.json`). `app.config.ts` auto-wires
   it when present. **Do NOT commit it** — add to `.gitignore`.
4. EAS credentials: upload the FCM V1 service-account key so Expo can send push:
   Firebase → Project settings → **Service accounts → Generate new private key**
   → then `eas credentials` → Android → **Google Service Account → FCM V1**, upload it.
   (Modern Expo requires FCM **V1**; the legacy server key is gone.)
5. Rebuild after adding `google-services.json`.

## 2. Google Sign-In on Android
No native Google client needed — the app uses Supabase's web OAuth flow
(`signInWithOAuth` → in-app browser → `iclose://auth-callback` deep link), which
works identically on Android. Just confirm in **Supabase → Authentication → URL
Configuration → Redirect URLs** that `iclose://auth-callback` is listed (it's the
same entry iOS uses). Apple Sign-In is correctly hidden on Android.

## 3. Play service account (for `eas submit`)
1. Google Play Console → **Setup → API access** → link a Google Cloud project.
2. Create a **service account** with the **Service Account User** role, grant it
   access in Play Console (Users & permissions) with "Release to testing tracks".
3. Download its JSON key → save as `./google-play-service-account.json` in the
   repo root. Already gitignored; `eas.json` already points at it.

## 4. Build & submit
```bash
git pull && npm install
eas build --platform android --profile production   # produces a signed .aab, auto-increments versionCode
eas submit --platform android --latest              # uploads to the internal track
```
First run, EAS offers to generate the upload keystore — accept (EAS manages it).

## 5. Store listing (Play Console → your app → Main store listing)
- **App name:** iClose
- **Short description (80 chars):**
  Never pay commission. Buy property or close deals in the UAE for one flat fee.
- **Full description:** reuse the App Store description (docs/appstore-connect-2.0.0.md §5).
- **App icon (512×512):** `assets/play/icon-512.png`
- **Feature graphic (1024×500):** `assets/play/feature-graphic-1024x500.png`
- **Phone screenshots (2–8):** `assets/play/0*-1080x2160.png` (order 01→05; these are 2:1, Play-compliant)
- **Category:** Finance or Business · **Tags:** real estate, property
- **Contact email:** hello@iclose.ae · **Privacy policy:** https://www.iclose.ae/privacy

## 6. Data safety form (Play Console → App content → Data safety)
Declare (collected, linked to user, NOT for tracking, encrypted in transit):
- Personal info: Name, Email, Phone
- Financial info: bank account / IBAN details
- Photos: verification documents
- App activity / App info: for app functionality
Include a data-deletion path: in-app Account → Delete account, and hello@iclose.ae.

## 7. Content rating (App content → Content rating)
Complete the IARC questionnaire — a finance/utility app with no objectionable
content rates **Everyone / PEGI 3**.

## 8. Other App content items (all required to publish)
- Target audience: 18+
- Ads: **No** (app has no ads)
- News app: No · Government app: No · COVID: No
- Data safety ✓ (above) · Privacy policy URL ✓
- Financial features: declare it deals with real-estate transactions if asked.

## 9. Reviewer test account (App access)
Under **App content → App access**, add credentials so Google can log in:
- Email: `review@iclose.ae`  Password: `Review-iClose-2026!`
(Same seeded broker demo account used for Apple review.)

## 10. Release
Internal testing → validate on a real device → promote to Closed testing (for
the 14-day requirement if applicable) → **Production**. Google review is usually
a few days for the first submission.
