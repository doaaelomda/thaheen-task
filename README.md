# Thaheen — Mini Offline LMS (Angular Screening Task)

A small, fully offline student portal for Thaheen: browse courses, watch recorded
lessons with a custom video player, and pick up exactly where you left off — no
backend, no API calls, everything ships from `src/assets`.

## Running it

```bash
npm install
ng serve
```

Then open `http://localhost:4200`. The app defaults to Arabic + RTL; use the
language button in the header to switch to English.

```bash
ng build   # production build, outputs to dist/ThaheenTask
ng test    # unit tests (Karma + Jasmine)
```

## What's implemented

- **Courses page** (`/courses`) — course cards (thumbnail, title, instructor,
  lesson count, progress %) and a "continue watching" card when a lesson is
  in progress.
- **Course details** (`/courses/:courseId`) — sections/lessons with duration
  and status (not started / in progress / completed); lessons unlock in
  sequence, locked ones are shown disabled with a lock icon.
- **Lesson player** (`/courses/:courseId/lessons/:lessonId`) — custom
  play/pause, seek bar, current time/duration, fullscreen, playback speed
  (1x/1.25x/1.5x/2x, remembered across lessons), resume-from-last-position,
  auto-complete at 90% watched, a "next lesson" button, a route guard that
  redirects a directly-typed locked-lesson URL back to the course page with a
  friendly message, and a proper not-found state for a bad lesson id.
- **Local persistence** — positions and completed lessons survive a refresh,
  stored behind a `ProgressStorage` abstraction (see below) so swapping in a
  real API later doesn't touch the rest of the app.
- **Arabic-first / RTL** — `dir="rtl"` and `lang="ar"` by default, a working
  Arabic ⇄ English switch (bonus), responsive layout down to mobile widths.
- **Loading / empty / error states** — a spinner while the catalog loads, an
  empty state for a course with no lessons, and an error state if a video
  file fails to load or the catalog itself fails to fetch.
- **Bonus items done**: Arabic/English switch, remembered playback speed,
  keyboard shortcuts in the player (space = play/pause, ←/→ = seek 5s).
- **Bonus items skipped** (see "With more time" below): dark mode,
  search/filter, per-lesson notes.

## Architecture & state management

- **Standalone components everywhere**, lazy-loaded per route
  (`app.routes.ts`), zoneless change detection (`provideZonelessChangeDetection`),
  SSR shell via Angular's server builder.
- **Signals, not RxJS, for state.** `CoursesService` and `ProgressService`
  both hold a private `signal<...>` and expose `computed()` read-only views;
  components read signals directly in templates. I picked signals over an
  RxJS-store because the state here is simple, synchronous, local key/value
  data (no streams to compose, debounce or combine), and signals keep the
  components free of subscription/unsubscription bookkeeping while staying
  zoneless-friendly.
- **`ProgressService`** is the single source of truth for a student's
  progress and owns every rule the task cares about: the 90% completion
  threshold, the sequential-unlock check, the progress-percentage
  calculation, and the "continue watching" lookup. Components only ever call
  into this service — none of that logic lives in a template or a component
  method, which is also why it's the thing the unit tests target directly.
- **`ProgressStorage`** is an abstract class used as an injection token, with
  `LocalStorageProgressStorage` as the only implementation today
  (`app.config.ts` wires it with a single `{ provide: ProgressStorage, useClass: ... }`).
  Swapping to a backend later is one new class plus one provider line — every
  other file, including `ProgressService`, stays untouched.
- **`CoursesService`** loads `assets/data/courses.json` once via
  `HttpClient` (per the task's suggested option — a static `import` would
  also have worked and is arguably simpler for genuinely static data; I used
  `HttpClient` mainly to exercise the loading/error states honestly).
- **Route guard**: `lessonUnlockGuard` is a functional `CanActivateFn`. It
  deliberately lets a *non-existent* lesson id through (the component then
  renders its own not-found state) but redirects a *locked* lesson back to
  the course page with a `?locked=<id>` query flag the page reads to show a
  friendly banner — this covers both in-app navigation and a locked URL
  typed directly.
- **Data shape**: I kept the task's suggested lesson shape (`id`, `title`,
  `durationSec`, `video`) and course/section shape exactly as suggested.
  `durationSec` in the JSON is only used for the up-front display in course
  details, before the video has loaded; the player itself always trusts the
  real `<video>` element's `duration`/`currentTime` for the 90% rule and
  resume position, so a wrong or approximate JSON value can't corrupt
  progress tracking.

## Data & media

`src/assets/data/courses.json` has 2 courses (Anatomy Fundamentals, Nursing
Principles), 2 sections each, 2 lessons per section (8 lessons total). Since
I couldn't pull real royalty-free footage inside this environment, the 3
video files under `src/assets/videos/` are short (12–18s) synthetic test
clips generated locally with `ffmpeg` (color-bar/test patterns + a tone) —
each lesson still points at a real, playable local MP4 under 200KB, so every
player feature (seek, speed, resume, 90% completion, error state) works
end-to-end exactly as it would with real lecture footage; only the visual
content itself is a placeholder. Thumbnails are plain inline SVGs for the
same reason (no external image fetching).

## Trade-offs & known issues

- **SSR renders client-side only.** The project came scaffolded with
  SSR/prerendering. Since this app has no backend and loads its data via
  `HttpClient` from local assets — which needs an absolute base URL to
  resolve during actual server-side rendering — I set `app.routes.server.ts`
  to `RenderMode.Client` for every route rather than fighting that plumbing
  for a small offline app. A production app with a real API would render
  these routes on the server instead.
- **No image/video existence pre-check.** The "broken video" error state is
  driven by the `<video>` element's native `error` event, which is honest
  but means a broken thumbnail image just shows an alt-text box rather than
  a styled error state — acceptable for this scope.
- **Progress writes on every `timeupdate`** (throttled to once per whole
  second) rather than batched/debounced further; fine for `localStorage` at
  this scale, would batch more aggressively against a real API.
- **Angular Material** wasn't used even though it's mentioned as fine in the
  brief — the project came with PrimeNG pre-installed instead, but its
  theme config was broken (importing CSS paths from an old PrimeNG version
  that don't exist in the installed v20, which is what was breaking `ng
  serve` before I touched the project). Since a custom video player was
  required anyway and the rest of the UI is simple, I removed the PrimeNG
  wiring and built everything in plain Tailwind rather than fixing a theme
  I wasn't going to use.

## With more time

- Dark mode and a course search/filter (both listed as bonus, skipped to
  stay inside the time box).
- Per-lesson notes saved locally.
- A "virtual scroller" / pagination story if the catalog were large — right
  now everything loads and renders at once, which is fine for 2 courses.
- Real captured footage instead of synthetic placeholder video, and proper
  photographed/designed thumbnails instead of inline SVGs.
- Component-level tests (the brief specifically asked to test the service/
  guard rather than components, which is what I did, but a few template
  smoke tests would still be worth adding).

## Time spent

Roughly 5–6 hours, in line with the suggested time box.
