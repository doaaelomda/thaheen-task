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

## Project structure

```text
src/app/
├── app.config.ts, app.config.server.ts   # app-wide providers: router, HttpClient
│                                          #   + errorInterceptor, i18n, hydration,
│                                          #   the ProgressStorage/AuthStorage tokens
├── app.routes.ts, app.routes.server.ts   # client routes (lazy-loaded) + SSR render mode
├── app.ts / app.html                     # root shell: header, global toast, router-outlet, footer
│
├── core/                                 # app-wide, not page-specific
│   ├── guard/          lessonUnlockGuard — the one functional CanActivateFn
│   ├── interceptors/    errorInterceptor — global HTTP error → toast
│   ├── layout/          header-component, footer-component
│   ├── models/          course.model.ts, progress.model.ts, auth.model.ts
│   │                     (pure interfaces/types only — zero `any`)
│   ├── services/         CoursesService, ProgressService (+ ProgressStorage),
│   │                     AuthService (+ AuthStorage), LanguageService,
│   │                     ThemeService, ToastService
│   └── utils/            lesson-order.ts — the single place that flattens
│                          a course's sections into an ordered lesson list
│
├── features/                             # one folder per routed page
│   ├── home/            landing page, stats, "continue watching" CTA
│   ├── courses/         catalog: search/filter/sort, course cards
│   ├── course-details/  sections/lessons, unlock state, enroll button
│   ├── lesson-player/   the video player page
│   └── auth/            mock login / sign-up
│
└── shared/
    ├── components/       LoadingSpinner, ErrorState, EmptyState, NotFound,
    │                     Skeleton (+ CourseCardSkeleton), Toast, CourseCard,
    │                     UiButton (`app-button`), UiInput (`app-input`)
    └── pipes/            DurationPipe ("m:ss" / "h:mm:ss")

src/assets/
├── data/courses.json     # the 2-course catalog
├── videos/                # the lesson mp4s
└── i18n/{ar,en}.json      # all UI copy, two flat JSON files ngx-translate loads
```

The rule of thumb: `core/` is singleton, app-wide stuff any page can depend on;
`features/` is one folder per route, never imported by another feature;
`shared/` is small, dumb, reusable presentation pieces with no business logic
of their own (they take inputs and render — the business logic they need
lives in `core/services`).

## What's implemented

- **Courses page** (`/courses`) — course cards (thumbnail, title, instructor,
  lesson count, progress %), a "continue watching" card, and **search / filter
  (by instructor, by progress status) / sort (name, instructor, progress)**.
- **Course details** (`/courses/:courseId`) — sections/lessons with duration
  and status (not started / in progress / completed); lessons unlock in
  sequence, locked ones are shown disabled with a lock icon and the reason
  (needs login / needs enrollment / needs the previous lesson completed).
- **Lesson player** (`/courses/:courseId/lessons/:lessonId`) — custom
  play/pause, seek bar, current time/duration, fullscreen, playback speed
  (1x/1.25x/1.5x/2x, remembered across lessons), resume-from-last-position,
  auto-complete at 90% watched, a "next lesson" button, keyboard shortcuts
  (space = play/pause, ←/→ = seek 5s), **per-lesson notes saved locally**, a
  route guard that redirects a directly-typed locked-lesson URL back to the
  course page with a friendly message, and a proper not-found state for a bad
  lesson id.
- **Local persistence** — positions, completed lessons, notes, enrollment and
  the last playback speed all survive a refresh, stored behind a
  `ProgressStorage` abstraction (see below) so swapping in a real API later
  doesn't touch the rest of the app.
- **Arabic-first / RTL** — `dir="rtl"` and `lang="ar"` by default, a working
  Arabic ⇄ English switch, directional icons (arrows) mirror correctly per
  language instead of being hardcoded, responsive layout down to mobile
  widths, **dark mode**.
- **Loading / empty / error states** — a spinner/skeleton while the catalog
  loads, an empty state for a course with no lessons or a filtered search
  with no results, and an error state if a video file fails to load or the
  catalog itself fails to fetch (courses page only — see Known issues).
- **All bonus items done**: dark mode, search/filter courses, keyboard
  shortcuts, per-lesson notes, remembered playback speed.

### Beyond the original brief

While iterating with the reviewer past the initial submission, the following
were added on top of the task's required scope:

- **Mock local login/sign-up** (`AuthService`/`AuthStorage`) — no backend,
  accounts and session live in `localStorage`.
- **Free-preview gating**: a signed-out visitor can only watch the single
  first lesson of the first course; anything else redirects to `/login` with
  a toast.
- **Per-course enrollment**: a signed-in student must explicitly "enroll" in
  a course (`ProgressService.enroll`) before its progress %, status badges,
  and lessons past the free preview unlock — enrolling is a one-click action
  on the course details page.
- **A global toast system** (`ToastService` + `ToastComponent`, mounted once
  in `app.html`) and an **HTTP error interceptor** (`errorInterceptor`) that
  surfaces a toast for any failed request anywhere in the app.
- A pass unifying every real call-to-action button through one shared
  `UiButtonComponent` (`app-button`), and removing duplicated Tailwind class
  strings (e.g. the home page's four feature cards, previously copy-pasted,
  now render from a data array).

## Architecture & State Management

**Standalone components everywhere**, lazy-loaded per route (`app.routes.ts`),
zoneless change detection (`provideZonelessChangeDetection`), SSR shell via
Angular's server builder.

**Signals, not RxJS, for state.** I picked signals over an RxJS store because
every piece of state here is simple, synchronous, local key/value data (course
progress, an auth session, a language/theme choice) — there's nothing to
compose, debounce, or combine as a stream. The pattern is the same in every
service:

```ts
private readonly state = signal<ProgressState>(this.storage.read());
readonly playbackRate = computed(() => this.state().lastPlaybackRate ?? 1);

private persist(next: ProgressState): void {
  this.state.set(next);       // 1. update the in-memory signal
  this.storage.write(next);   // 2. write it through to localStorage
}
```

A private writable `signal()` holds the real state; every public read is a
`computed()` derived from it, so components never mutate state directly —
they call a method (`updatePosition`, `enroll`, `setNote`, ...) and read the
result back through a signal. Components inject the service, read its signals
straight in `OnPush` templates, and never touch `localStorage` or subscribe
to anything — no async pipe, no manual unsubscribe, which is also what keeps
everything zoneless-friendly.

**`ProgressService`** is the single source of truth for a student's
relationship to a course and owns every rule the task cares about: the 90%
completion threshold, the sequential-unlock check, the progress-percentage
calculation, the "continue watching" lookup, plus (added later) enrollment
and per-lesson notes. Components only ever call into this service — none of
that logic lives in a template or a component method, which is also why it's
the thing the unit tests target directly (24 tests, `progress.service.spec.ts`
+ `lesson-unlock.guard.spec.ts`).

**Storage is an adapter, not a detail.** `ProgressStorage` and `AuthStorage`
are abstract classes used as injection tokens, each with exactly one
`LocalStorage*` implementation wired in `app.config.ts`
(`{ provide: ProgressStorage, useClass: LocalStorageProgressStorage }`).
Swapping to a real backend later is one new class implementing `read()`/
`write()` plus one provider line — `ProgressService`, `AuthService`, and
every component that depends on them stay untouched. Tests substitute an
in-memory fake the same way, so no test ever touches real `localStorage`.

**`CoursesService`** loads `assets/data/courses.json` once via `HttpClient`
(a static `import` would also have worked and is arguably simpler for
genuinely static data; I used `HttpClient` mainly to exercise the
loading/error states honestly) and exposes `courses`/`loading`/`error` as
computed signals, with `ensureLoaded()` de-duping concurrent calls.

**Route guard**: `lessonUnlockGuard` is a functional `CanActivateFn` that
layers four checks in order — a non-existent lesson id is let through
deliberately (the component renders its own not-found state); a signed-out
visitor is bounced to `/login` unless it's the free-preview lesson; a
signed-in but unenrolled student is bounced back to the course page; and
finally a lesson that's still locked by the sequential-progress rule
redirects to the course page with a `?locked=<id>` query flag the page reads
to show a friendly banner. This one guard covers both in-app navigation and a
locked/gated URL typed directly.

## Trade-offs

- **SSR renders client-side only.** The project came scaffolded with
  SSR/prerendering. Since this app has no backend and loads its data via
  `HttpClient` from local assets — which needs an absolute base URL to
  resolve during actual server-side rendering — `app.routes.server.ts` sets
  `RenderMode.Client` for every route rather than fighting that plumbing for
  a small offline app.
- **No image/video existence pre-check.** The "broken video" error state is
  driven by the `<video>` element's native `error` event, which is honest but
  means a broken thumbnail image just shows an alt-text box rather than a
  styled error state — acceptable for this scope.
- **Progress writes on every `timeupdate`**, throttled to once per whole
  second, rather than debounced further; fine for `localStorage` at this
  scale, would batch more aggressively against a real API.
- **Angular Material wasn't used** even though it's mentioned as fine in the
  brief — the project came with PrimeNG pre-installed instead, but its theme
  config was broken (importing CSS paths from an old PrimeNG version that
  don't exist in the installed v20, which is what was breaking `ng serve`
  before I touched the project). Since a custom video player was required
  anyway and the rest of the UI is simple, I removed the PrimeNG wiring and
  built everything in plain Tailwind rather than fixing a theme I wasn't
  going to use.
- **Progress/notes/enrollment aren't scoped per account.** `ProgressService`
  keeps one shared local store regardless of which mock account is currently
  signed in — fine for a single-user demo/review, but two different accounts
  on the same browser would see each other's progress and notes. Scoping the
  storage key by the signed-in user id is the natural fix (see "with more
  time" below).
- **The header/footer logo is a real external URL** (`cdn.msaaq.com`). The
  brief's "no external URLs" instruction is scoped to course *data*, but it's
  worth flagging explicitly rather than leaving it silent — swapping it for a
  bundled local asset would remove the last external dependency entirely.
- **Scope grew well past the original brief** after the initial submission
  (mock login, per-course enrollment, a global toast/HTTP-interceptor system,
  a shared-button pass) at the reviewer's direct request. None of that was in
  the original task PDF; flagging it so it's clear which parts are the
  screening task itself versus follow-up iteration.

## Known issues

- **`course-details-page` and `lesson-player-page` don't read
  `CoursesService.error()`.** Only the courses page has a dedicated
  "couldn't load courses" state; if the catalog fetch fails after landing
  directly on a course or lesson URL, those two pages fall back to their
  "not found" state instead of a proper error message. The new HTTP
  interceptor now at least surfaces a toast for the failed request, but the
  per-page error UI gap is still open.
- **No true 404 route.** `app.routes.ts`'s wildcard route silently redirects
  to `/courses` instead of rendering `NotFoundComponent` for a genuinely
  unknown URL.
- **No retry action** on `ErrorStateComponent`/`EmptyStateComponent` — a
  failed load requires a manual page refresh.
- **Hit and fixed during this round**: registering the HTTP error
  interceptor initially injected `TranslateService` inside it. Since the
  interceptor runs on *every* HTTP request — including `ngx-translate`'s own
  request to fetch `ar.json`/`en.json` — that created a circular DI chain
  (translation loader → HttpClient → interceptor → TranslateService) that
  silently broke all translations app-wide (every key rendered literally,
  e.g. `home.heroTitle` instead of the Arabic/English text) while leaving
  unrelated requests like the course catalog fetch unaffected. Fixed by
  having the interceptor pick its toast text from `document.documentElement
  .lang` instead of injecting `TranslateService` at all. Leaving this here as
  a heads-up: anything else added to this interceptor should avoid depending
  on `TranslateService`/`LanguageService` for the same reason.

## What I'd do with more time

- Wire the missing error states (course-details, lesson-player), add a real
  404 page, and add a retry button to `ErrorStateComponent`.
- Scope `ProgressService`'s storage key by the signed-in account id instead
  of one shared global store, so multiple mock accounts don't share progress.
- Component-level smoke tests — the brief specifically asked to test the
  service/guard rather than components (which is what I did), but a few
  template tests would still be worth adding.
- Real captured footage instead of the short synthetic placeholder clips, and
  proper photographed/designed thumbnails instead of inline SVGs.
- A "virtual scroller" / pagination story if the catalog were large — right
  now everything loads and renders at once, fine for 2 courses.
- Move the logo off the external CDN URL and into `src/assets`.

## Time spent

Roughly 5–6 hours for the original required scope plus all bonus items,
matching the suggested time box. Meaningfully more time afterward implementing
reviewer-requested extensions beyond the original brief — mock auth, per-course
enrollment gating, the global toast/HTTP-interceptor system, the shared-button
pass, RTL icon-mirroring fixes, and a full comment-removal pass across the
codebase — which pushed total time well past the original 4–6 hour estimate.
