# Handover: مجمع ابن تيمية القرآني website

Read this first, then continue from **Next steps**.

## What this is

An Arabic (RTL) landing page for a Quran memorization complex for boys, **مجمع ابن تيمية القرآني**, plus a private admin panel where the manager logs in to upload photos and videos and write blog posts. These appear on the public site immediately.

- Project folder: `E:\Desktop\web\react\sell\ibn-taymyah`
- GitHub: https://github.com/realalabady/ibn-taymyah (branch `main`, everything pushed)
- Firebase project ID: `ibn-taymayh` (note the spelling differs from the folder name)
- Owner and Firebase CLI login: fakealabady@gmail.com
- Audience: parents enrolling their sons. The copy is written to parents.

## Stack

- **Next.js 16.4** (App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, TypeScript.
  - This Next version is newer than most model training data. **Read `node_modules/next/dist/docs/` before using any Next API** (see `AGENTS.md`).
- **Tailwind v4.** Tokens are CSS variables in `src/app/globals.css` and mapped through `@theme inline`.
- **Motion** (`motion/react`) for animation, **Phosphor** icons. Server components import icons from `@phosphor-icons/react/ssr`; client components import from `@phosphor-icons/react`.
- **Firebase:** Auth (email/password), Firestore, Storage. The client SDK runs in the browser for the admin panel. The server reads public data with `firebase/firestore/lite`.
- **jose:** verifies Firebase ID tokens in the server action.
- **Fonts** (`next/font/google`): Readex Pro (display), IBM Plex Sans Arabic (body), Amiri (Quran and hadith text).

## Architecture

### Public data flow

`src/lib/data.ts` holds the cached server reads (`"use cache"`, `cacheLife("hours")`, `cacheTag("content")`):

- `getMedia(count)`
- `getFeaturedImage()`
- `getPosts(count?)`
- `getPost(id)`

Each one catches its own errors and returns empty or null, so a page never crashes.

### Instant updates

After every admin change, `publishChanges(user)` in `src/components/admin/AuthProvider.tsx` calls the server action `refreshContent(idToken)` in `src/app/actions.ts`. That action:

1. Verifies the token with jose.
2. Confirms the user is an admin by reading `admins/{uid}` through the Firestore REST API with the user's own token.
3. Calls `updateTag("content")`.

### Firestore collections

- `admins/{uid}`: any doc there grants admin. It can only be created by hand in the console; the rules deny writes.
- `media`: `type` ("image" or "video"), `url`, `path`, `caption`, `width`, `height`, `featured`, `createdAt`.
- `posts`: `title`, `excerpt`, `body`, `coverUrl`, `coverPath`, `published`, `createdAt`, `updatedAt`.
  - Post URLs use the doc ID: `/blog/{id}`.
  - Body format: a blank line separates paragraphs, and a line starting with `## ` becomes a subheading.

### Security rules

`firestore.rules` and `storage.rules` are deployed. Writes require the user's UID to exist in `admins`.

- Storage size limits: images under 20 MB, videos under 500 MB.
- The Storage rules read Firestore. The IAM role `roles/firebaserules.firestoreServiceAgent` was already granted to the Storage service agent for this.
- Indexes in `firestore.indexes.json` are deployed: posts (published, createdAt desc) and media (featured, createdAt desc).
- Deploy rules and indexes with:
  ```
  firebase deploy --only firestore,storage,auth --project ibn-taymayh
  ```

### Routes

- `src/app/(site)/`: `/` (home), `/gallery`, `/blog`, `/blog/[id]`. The `[id]` page reads its params inside `<Suspense>`, as Cache Components requires.
- `src/app/admin/`:
  - `/admin` is the media manager. It shows the login form when signed out.
  - `/admin/posts` lists posts.
  - `/admin/posts/edit?id=…` edits a post; with no `id` it creates one.
  - The admin pages export `instant = false`, because their content renders only after client-side sign-in.

### Key files

- `src/site.config.ts`: site name, WhatsApp number (966534959517), location, registration message, nav links.
- `src/components/site/`: Nav, Hero, Program (bento), Hadith, Journey (scroll-drawn line), GallerySection, GalleryGrid (masonry plus lightbox), LatestPosts, RegisterCTA, Footer, Logo (`Logo` is emblem plus text; `LogoFull` is the full image), Button.
- `src/components/admin/`: AuthProvider, AdminShell, LoginForm, MediaManager, PostsList, PostEditor, ui (Field, Input, Textarea, Btn, ConfirmDelete, Notice).
- `src/components/motion/`: Reveal (in-view fade-up) and Stagger, StaggerItem and MaskReveal (on-mount hero motion).
- `src/lib/`: `motion.ts` (tokens and springs), `upload.ts` (validation, dimensions, resumable upload), `format.ts` (Arabic dates and reading-time label), `firebase/config.ts` (public web config), `firebase/client.ts`.
- `public/logo.png`: full logo with transparent background. `public/logo-mark.png`: emblem only. `src/app/icon.png`: favicon.

## Design system and rules followed

Skills used: `taste-skill`, `soft-skill`, `ecc:motion-foundations`, `ecc:make-interfaces-feel-better`. Reload them before any design work.

### Colors

Taken from the logo.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#0d6a22` | `#4fbf68` | Everything interactive |
| `--sun` / `--sun-soft` | logo yellow | logo yellow | Warm highlights only, never controls |

Neutrals are slightly green-tinted. The site follows the visitor's system light or dark setting, and dark-mode values live under `prefers-color-scheme: dark`.

### Radius

- Controls: pill.
- Cards: `rounded-[2rem]`, with a double-bezel shell (`p-2` outer, `rounded-[1.5rem]` inner).
- Inputs: `rounded-2xl`.

### Copy and layout

- No em dashes anywhere.
- No invented numbers or fake testimonials.
- No stock photos of children. All photos come from what the manager uploads.
- One CTA label per intent: registering is always "سجّل ابنك" and goes to the WhatsApp link.
- RTL throughout: use logical properties (`ps`/`pe`, `start`/`end`). Forward arrows point left.

### Motion

- Animate only transform and opacity (plus blur on enter).
- Every animation respects `useReducedMotion`.
- Interactive states use CSS transitions with `ease-spring` (`cubic-bezier(0.32,0.72,0,1)`).

### Quran text

Only these verified texts are used:

- اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ
- وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
- The hadith «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ», attributed to رواه البخاري.

Don't add verses without checking the exact wording.

### Hero

- If the manager has starred a photo, it is shown.
- Otherwise the hero shows "اقْرَأْ" on a sun-glow panel.

## Environment gotchas (Windows)

- Run `npx` and `npm` through **PowerShell**. In Git Bash, `npx` fails with `'"node"' is not recognized`.
- These CLIs are installed and logged in: `firebase` (fakealabady@gmail.com) and `gcloud`.
- Dev server: `npm run dev` on port 3000. `.claude/launch.json` has the config `ibn-taymyah-dev`.
- When the browser pane is hidden, animation frames are throttled, so screenshots show half-finished entrance animations. To check layout, inject the style below, or measure with JS:
  ```css
  [style*="opacity"]{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}
  ```
- Run checks with `npx eslint src`, `npx tsc --noEmit` and `npm run build`. All passed at handover.

## Status at handover

Done:

- [x] Full public site and admin panel, built and pushed.
- [x] Firebase web app registered; rules, indexes and the email/password provider deployed.
- [x] Storage → Firestore IAM role granted.
- [x] Real logo applied, palette taken from it, site renamed to مجمع ابن تيمية القرآني.
- [x] Real WhatsApp number and location set in `site.config.ts`.

## Next steps

1. **Make the manager an admin.**
   - The user must first create the Auth user **fakealabady@gmail.com** in Firebase console → Authentication → Add user. Never create it yourself: it needs a password, which only the user sets. Wait for them to say it's done.
   - Get the UID:
     ```
     firebase auth:export users.json --format=json --project ibn-taymayh
     ```
     Delete `users.json` afterwards.
   - Create the empty doc `admins/{uid}` through the Firestore REST API, using a token from `gcloud auth print-access-token`. Or ask the user to add it in the console.
2. **Test the admin panel end to end** at `/admin`: log in, upload an image and a video, star an image as the hero image, write and publish a post. Then confirm all of it appears on `/`, `/gallery` and `/blog`.
3. **Deploy to Vercel.** Import the GitHub repo. No environment variables are needed, because the Firebase config is public and in code.
   - Then add the Vercel domain in Firebase console → Authentication → Settings → Authorized domains. Without it, the admin login fails on the live site.
4. **Optional polish:**
   - The location string has no separators. The user may want commas, for example "جامع ابن تيمية، الدانة الشمالية، الظهران".
   - `public/logo.png` is about 800 KB. It's served through `next/image`, so that's fine, but it could be compressed.
   - `/blog/{missing-id}` shows the not-found UI with HTTP 200, because notFound streams inside Suspense. Acceptable for now.
