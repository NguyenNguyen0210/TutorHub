# Marketplace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/` marketplace screen with the approved Cobalt Editorial layout, card, filters, states, mobile drawer, and the centered four-link public topbar, while preserving every existing filter and API behavior.

**Architecture:** Keep all marketplace visual tokens scoped under a `.marketplace-v2` wrapper and a dedicated `marketplace.css`; do not edit `tokens.css` or `tailwind.config.js`. Refactor presentation components (`HeroSection`, `CategoryFilterBar`, `TutorCard`, `FilterSidebar`) and the page composition (`Marketplace.jsx`). The shared `PublicTopbar` receives the approved global nav change: three-column grid, centered guest nav with `Trở thành gia sư`, and a `lg` breakpoint for the mobile drawer. Pure formatting/pagination helpers are extracted and tested with Node's built-in test runner.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, React Router 7, Lucide React, Node `--test` (no React test library in this repo).

---

## Scope Check

This is one cohesive screen redesign plus one shared topbar change. It does not need to be split into independent subsystems. The topbar task is isolated because it affects every public page and must be verified separately.

## File Structure Map

**New files**
- `src/frontend/src/styles/marketplace.css` — scoped `--mkt-*` variables, display/body/mono classes, card rule, hero highlight, pagination override, reduced-motion rules.
- `src/frontend/src/utils/marketplaceHelpers.js` — `formatRating`, `getPaginationRange`, `formatCount`.
- `src/frontend/test/marketplaceHelpers.test.mjs` — Node tests for the helpers.
- `src/frontend/src/components/discovery/MarketplaceCardSkeleton.jsx` — six-card loading skeleton matching the new card height.

**Modified files**
- `src/frontend/index.html` — add Plus Jakarta Sans to the existing Google Fonts request.
- `src/frontend/src/components/layout/PublicTopbar.jsx` — centered four-link nav, active underline, `lg` drawer breakpoint, remove duplicate guest link.
- `src/frontend/src/components/discovery/HeroSection.jsx` — editorial two-column hero, search, popular tags, trust rail.
- `src/frontend/src/components/discovery/CategoryFilterBar.jsx` — bare icons, underline active state, data-driven order, accessible group semantics.
- `src/frontend/src/components/discovery/TutorCard.jsx` — new card anatomy, package-price semantics, three subjects, compact CTA/heart.
- `src/frontend/src/components/discovery/FilterSidebar.jsx` — new visual treatment, optional footer summary, all controls preserved.
- `src/frontend/src/components/common/EmptyState.jsx` — optional secondary action; existing callers unchanged.
- `src/frontend/src/components/common/ErrorState.jsx` — no API change; the marketplace passes scoped `className` overrides.
- `src/frontend/src/components/ui/Avatar.jsx` — optional `panelClassName` on `Drawer` so portal content inherits `--mkt-*`.
- `src/frontend/src/pages/discovery/Marketplace.jsx` — wrapper, layout, toolbar, quick chips, states, pagination, mobile sticky bar, drawer summary, timeout trace ID.

**Do not modify**
- `src/frontend/src/styles/tokens.css`
- `src/frontend/tailwind.config.js`
- Backend/API/service contracts.

## Task Outline

1. Add tested pure helpers.
2. Add the font and scoped marketplace CSS foundation.
3. Refactor the shared topbar.
4. Refactor the hero.
5. Refactor the category bar.
6. Refactor the tutor card.
7. Refactor the filter sidebar and drawer panel hook.
8. Recompose the marketplace page, states, pagination, and mobile drawer.
9. Run full verification and capture final screenshots.

---

## Task 1: Add Tested Pure Helpers

**Files**
- Create: `src/frontend/src/utils/marketplaceHelpers.js`
- Create: `src/frontend/test/marketplaceHelpers.test.mjs`

**Why:** `TutorCard` needs Vietnamese one-decimal ratings, and the pagination footer needs a clamped visible range. Both are pure and easy to test with the repo's existing Node test runner.

- [ ] **Step 1: Write the failing tests first.**

Create `src/frontend/test/marketplaceHelpers.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRating,
  getPaginationRange,
  formatCount,
} from '../src/utils/marketplaceHelpers.js';

test('formatRating always returns one decimal with a Vietnamese comma', () => {
  assert.equal(formatRating(4.8), '4,8');
  assert.equal(formatRating(4.86), '4,9');
  assert.equal(formatRating('4.8'), '4,8');
  assert.equal(formatRating(0), '0,0');
  assert.equal(formatRating(null), '0,0');
  assert.equal(formatRating(undefined), '0,0');
  assert.equal(formatRating('not-a-number'), '0,0');
});

test('getPaginationRange clamps the visible range to the result count', () => {
  assert.deepEqual(getPaginationRange(1, 12, 142), { start: 1, end: 12 });
  assert.deepEqual(getPaginationRange(2, 12, 142), { start: 13, end: 24 });
  assert.deepEqual(getPaginationRange(12, 12, 142), { start: 133, end: 142 });
  assert.deepEqual(getPaginationRange(99, 12, 142), { start: 142, end: 142 });
  assert.deepEqual(getPaginationRange(0, 12, 142), { start: 1, end: 12 });
  assert.deepEqual(getPaginationRange(1, 12, 0), { start: 0, end: 0 });
});

test('formatCount uses Vietnamese grouping and handles empty values', () => {
  assert.equal(formatCount(142), '142');
  assert.equal(formatCount(1240), '1.240');
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(null), '0');
});
```

- [ ] **Step 2: Run the tests and confirm the module is missing.**

Run from `src/frontend`:

```powershell
npm test
```

Expected: the new test file fails with `ERR_MODULE_NOT_FOUND` for `src/utils/marketplaceHelpers.js`.

- [ ] **Step 3: Implement the helpers.**

Create `src/frontend/src/utils/marketplaceHelpers.js`:

```js
const ratingFormatter = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const countFormatter = new Intl.NumberFormat('vi-VN');

/** Format a tutor rating as `4,8`; invalid values become `0,0`. */
export function formatRating(value) {
  const number = Number(value);
  return ratingFormatter.format(Number.isFinite(number) ? number : 0);
}

/** Human-readable count with Vietnamese grouping. */
export function formatCount(value) {
  const number = Number(value);
  return countFormatter.format(Number.isFinite(number) ? Math.max(0, number) : 0);
}

/**
 * Return the 1-based first/last item numbers shown on the current page.
 * Empty results return { start: 0, end: 0 } so the UI can hide the line.
 */
export function getPaginationRange(page, pageSize, total) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const safePage = Math.max(1, Number(page) || 1);

  if (safeTotal === 0) return { start: 0, end: 0 };

  return {
    start: Math.min((safePage - 1) * safePageSize + 1, safeTotal),
    end: Math.min(safePage * safePageSize, safeTotal),
  };
}
```

- [ ] **Step 4: Run the tests again.**

```powershell
npm test
```

Expected: all three new tests pass, and the existing `authPersistence` and `idempotency` tests still pass.

- [ ] **Step 5: Commit.**

```powershell
git add src/frontend/src/utils/marketplaceHelpers.js src/frontend/test/marketplaceHelpers.test.mjs
git commit -m "test: add marketplace formatting and pagination helpers"
```

---

## Task 2: Add the Font and Scoped Marketplace CSS Foundation

**Files**
- Modify: `src/frontend/index.html`
- Create: `src/frontend/src/styles/marketplace.css`

**Why:** The new visual language must not leak into other screens. Every new colour, font, radius, and motion decision lives under `.marketplace-v2` or in `marketplace.css`.

- [ ] **Step 1: Add Plus Jakarta Sans to the existing font request.**

In `src/frontend/index.html`, replace the single Google Fonts stylesheet link with:

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Keep the existing `preconnect` links above it. This is a global font download, but only `.mkt-display` uses Plus Jakarta Sans.

- [ ] **Step 2: Create the scoped token and base layer.**

Create `src/frontend/src/styles/marketplace.css` with this first half:

```css
/*
 * Marketplace V2 — Cobalt Editorial.
 * All variables are scoped to .marketplace-v2 so other screens keep the
 * existing TutorHub tokens. Do not move these values into tokens.css.
 */
.marketplace-v2 {
  --mkt-canvas: #f7f8fa;
  --mkt-surface: #ffffff;
  --mkt-ink: #0f172a;
  --mkt-body: #475569;
  --mkt-muted: #94a3b8;
  --mkt-line: #e2e8f0;
  --mkt-cobalt: #1f4fd8;
  --mkt-cobalt-hover: #1a43b8;
  --mkt-cobalt-50: #eff3fe;
  --mkt-cobalt-100: #dce4fb;
  --mkt-amber: #d97706;
  --mkt-green: #047857;
  --mkt-danger: #b91c1c;
  --mkt-display: 'Plus Jakarta Sans', 'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif;
  --mkt-body-font: 'Be Vietnam Pro', Inter, ui-sans-serif, system-ui, sans-serif;
  --mkt-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  /* 1240px of usable content; page-shell reads this variable. */
  --layout-content-max: 77.5rem;
  background-color: var(--mkt-canvas);
  color: var(--mkt-ink);
}

/* The Drawer portal is outside the page wrapper; keep its panel white. */
.marketplace-v2.mkt-drawer-panel {
  background-color: var(--mkt-surface);
}

.marketplace-v2 .mkt-display {
  font-family: var(--mkt-display);
  font-weight: 800;
}

.marketplace-v2 .mkt-body {
  font-family: var(--mkt-body-font);
}

.marketplace-v2 .mkt-mono {
  font-family: var(--mkt-mono);
}

.marketplace-v2 .mkt-tabular {
  font-variant-numeric: tabular-nums;
}

.marketplace-v2 .mkt-highlight {
  background-image: linear-gradient(transparent 62%, var(--mkt-cobalt-100) 62%);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding-inline: 0.04em;
}

.marketplace-v2 .mkt-card {
  position: relative;
  background: var(--mkt-surface);
  border: 1px solid var(--mkt-line);
  border-radius: 12px;
}

.marketplace-v2 .mkt-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16px;
  bottom: 16px;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: var(--mkt-cobalt);
  opacity: 0.35;
  transition: opacity 180ms ease;
}

.marketplace-v2 .mkt-card:hover {
  border-color: var(--mkt-cobalt-100);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
  transform: translateY(-1px);
}

.marketplace-v2 .mkt-card:hover::before,
.marketplace-v2 .mkt-card:focus-within::before {
  opacity: 1;
}

.marketplace-v2 :focus-visible {
  outline: 2px solid var(--mkt-cobalt);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .marketplace-v2 *,
  .marketplace-v2 *::before,
  .marketplace-v2 *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Add the reusable control classes.**

Append this second half to the same file:

```css
.marketplace-v2 .mkt-btn-primary {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  background: var(--mkt-cobalt);
  padding-inline: 14px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  transition: background-color 150ms ease, transform 150ms ease;
}

.marketplace-v2 .mkt-btn-primary:hover {
  background: var(--mkt-cobalt-hover);
}

.marketplace-v2 .mkt-btn-primary:active {
  transform: scale(0.98);
}

.marketplace-v2 .mkt-btn-secondary {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--mkt-line);
  border-radius: 8px;
  background: var(--mkt-surface);
  padding-inline: 14px;
  color: var(--mkt-body);
  font-size: 12px;
  font-weight: 700;
  transition: border-color 150ms ease, color 150ms ease;
}

.marketplace-v2 .mkt-btn-secondary:hover {
  border-color: var(--mkt-cobalt-100);
  color: var(--mkt-cobalt);
}

.marketplace-v2 .mkt-chip {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--mkt-line);
  border-radius: 999px;
  background: var(--mkt-surface);
  padding-inline: 12px;
  color: var(--mkt-body);
  font-size: 12px;
  font-weight: 600;
  transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
}

.marketplace-v2 .mkt-chip:hover {
  border-color: var(--mkt-cobalt-100);
  color: var(--mkt-cobalt);
}

.marketplace-v2 .mkt-chip[aria-pressed='true'] {
  border-color: var(--mkt-cobalt);
  background: var(--mkt-cobalt);
  color: #fff;
}

.marketplace-v2 .mkt-pagination [aria-current='page'] {
  background-color: var(--mkt-cobalt);
}

.marketplace-v2 .mkt-pagination button {
  border-radius: 8px;
}

@media (min-width: 640px) {
  .marketplace-v2 .mkt-btn-primary,
  .marketplace-v2 .mkt-btn-secondary,
  .marketplace-v2 .mkt-chip {
    min-height: 36px;
  }
}
```

- [ ] **Step 4: Import the stylesheet from the marketplace page only.**

In `src/frontend/src/pages/discovery/Marketplace.jsx`, add this import after the `Drawer` import:

```js
import '@/styles/marketplace.css';
```

- [ ] **Step 5: Build to verify the CSS compiles.**

Run from `src/frontend`:

```powershell
npm run build
```

Expected: build succeeds. No other screen has changed visually because the stylesheet is imported by `Marketplace.jsx` and every selector is scoped.

- [ ] **Step 6: Commit.**

```powershell
git add src/frontend/index.html src/frontend/src/styles/marketplace.css src/frontend/src/pages/discovery/Marketplace.jsx
git commit -m "style: add scoped marketplace v2 foundation"
```

---

## Task 3: Refactor the Shared Public Topbar

**Files**
- Modify: `src/frontend/src/components/layout/PublicTopbar.jsx`

**Why:** The approved topbar is a three-column grid with the guest nav centered and `Trở thành gia sư` in that nav. `PublicTopbar` is shared, so this is intentionally a global public-page change. Keep the existing 72px height and the existing auth hierarchy (`Đăng ký` outline, `Đăng nhập` primary). The mobile drawer moves from `md` to `lg` so the centered nav never collides with the right actions.

- [ ] **Step 1: Add the shared nav class helper.**

Immediately after the `myCoursesPath` declaration (around line 81), add:

```js
const isHome = location.pathname === '/' || location.pathname.startsWith('/tutors');
const navLinkClass = (active) =>
  cn(
    'inline-flex min-h-11 items-center border-b-2 px-3.5 py-2 text-[13.5px] font-semibold transition-colors',
    active
      ? 'border-brand-primary-600 text-brand-primary-700'
      : 'border-transparent text-fg-secondary hover:border-neutral-300 hover:text-fg'
  );
```

- [ ] **Step 2: Replace the header, container, logo, and desktop nav.**

Replace the block from `<header ...>` through `</nav>` (the current lines 84–176) with:

```jsx
<header className="sticky top-0 z-50 border-b border-border bg-surface">
  <div className="page-shell grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4">
    {/* Brand Logo */}
    <Link
      to={isAuthenticated ? getDashboardPath(role) : '/'}
      aria-label="TutorHub — trang chủ"
      className="flex shrink-0 items-center justify-self-start"
    >
      <Logo variant="mark" size={36} className="sm:hidden" />
      <Logo variant="horizontal" size={36} className="hidden sm:inline-flex" />
    </Link>

    {/* Center nav: four guest links, centered between logo and actions */}
    <nav className="hidden items-center justify-self-center gap-1 lg:flex" aria-label="Điều hướng chính">
      <Link
        to="/"
        aria-current={isHome ? 'page' : undefined}
        className={navLinkClass(isHome)}
      >
        Tìm gia sư
      </Link>

      <Link
        to="/services"
        aria-current={location.pathname.startsWith('/services') ? 'page' : undefined}
        className={navLinkClass(location.pathname.startsWith('/services'))}
      >
        Dịch vụ
      </Link>

      {!isAuthenticated ? (
        <>
          <Link
            to="/become-tutor"
            aria-current={location.pathname.startsWith('/become-tutor') ? 'page' : undefined}
            className={navLinkClass(location.pathname.startsWith('/become-tutor'))}
          >
            Trở thành gia sư
          </Link>

          <Link
            to="/how-it-works"
            aria-current={location.pathname === '/how-it-works' ? 'page' : undefined}
            className={navLinkClass(location.pathname === '/how-it-works')}
          >
            Cách hoạt động
          </Link>
        </>
      ) : (
        <>
          <Link
            to={schedulePath}
            aria-current={
              location.pathname.includes('/schedule') || location.pathname.includes('/sessions')
                ? 'page'
                : undefined
            }
            className={navLinkClass(
              location.pathname.includes('/schedule') || location.pathname.includes('/sessions')
            )}
          >
            Lịch học
          </Link>

          <Link
            to="/app/messages"
            aria-current={location.pathname.startsWith('/app/messages') ? 'page' : undefined}
            className={navLinkClass(location.pathname.startsWith('/app/messages'))}
          >
            Tin nhắn
          </Link>

          <Link
            to={myCoursesPath}
            aria-current={
              location.pathname.includes('/dashboard') || location.pathname.includes('/services')
                ? 'page'
                : undefined
            }
            className={navLinkClass(
              location.pathname.includes('/dashboard') || location.pathname.includes('/services')
            )}
          >
            Gói học của tôi
          </Link>
        </>
      )}
    </nav>
```

- [ ] **Step 3: Make the right actions the third grid column and remove the duplicate guest link.**

Replace the current right-actions opening `<div className="flex items-center gap-2.5 shrink-0">` with:

```jsx
<div className="flex shrink-0 items-center justify-self-end gap-2.5">
```

Then delete the guest-only `Trở thành gia sư` link inside the `!isAuthenticated` branch (the link with `to="/become-tutor"` and classes `hidden lg:inline-flex ...`). The guest branch must start directly with the `Đăng ký` link.

- [ ] **Step 4: Move the hamburger and mobile drawer to the `lg` breakpoint.**

Change the hamburger class from `md:hidden` to:

```jsx
className="lg:hidden flex h-11 w-11 items-center justify-center rounded-brand-md text-fg-secondary transition-colors hover:bg-neutral-100"
```

Change the mobile drawer wrapper from `md:hidden` to:

```jsx
className="lg:hidden border-t border-border bg-surface px-4 pb-4 pt-2 space-y-1 animate-fadeIn"
```

Remove `shadow-brand-sm` from that wrapper; the topbar now uses a hairline rule.

- [ ] **Step 5: Reorder and relabel the guest mobile drawer.**

Replace the current guest branch inside the mobile drawer (from `{!isAuthenticated ? (` to its closing `</>`) with:

```jsx
{!isAuthenticated ? (
  <>
    <Link
      to="/"
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
    >
      <Icon name="search" size="md" className="text-brand-primary-600" />
      Tìm gia sư
    </Link>
    <Link
      to="/services"
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
    >
      <Icon name="local_library" size="md" className="text-brand-primary-600" />
      Dịch vụ
    </Link>
    <Link
      to="/become-tutor"
      onClick={() => setMobileOpen(false)}
      className={cn(
        'flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold transition-colors',
        location.pathname.startsWith('/become-tutor')
          ? 'bg-brand-primary-50 text-brand-primary-600'
          : 'text-neutral-700 hover:bg-neutral-100'
      )}
    >
      <Icon name="school" size="md" className="text-brand-primary-600" />
      Trở thành gia sư
    </Link>
    <Link
      to="/how-it-works"
      onClick={() => setMobileOpen(false)}
      className={cn(
        'flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold transition-colors',
        location.pathname === '/how-it-works'
          ? 'bg-brand-primary-50 text-brand-primary-600'
          : 'text-neutral-700 hover:bg-neutral-100'
      )}
    >
      <Icon name="help_outline" size="md" className="text-brand-primary-600" />
      Cách hoạt động
    </Link>
    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
      <Link
        to="/auth/login"
        onClick={() => setMobileOpen(false)}
        className="flex h-11 items-center justify-center rounded-brand-md bg-primary text-caption font-semibold text-white shadow-brand-sm transition-all hover:bg-primary-hover active:scale-[0.98]"
      >
        Đăng nhập
      </Link>
      <Link
        to="/auth/register"
        onClick={() => setMobileOpen(false)}
        className="flex h-11 items-center justify-center rounded-brand-md border border-neutral-300 bg-white text-caption font-semibold text-neutral-800 transition-all hover:bg-neutral-50 active:scale-[0.98]"
      >
        Đăng ký
      </Link>
    </div>
  </>
) : (
```

Keep the authenticated branch after the `) : (` exactly as it is. The first two links in the drawer (`Tìm gia sư`, `Dịch vụ`) are currently rendered before the conditional. Delete those two old links so they are not duplicated; the new guest branch contains them, and the authenticated branch still needs them. Add the same two links to the authenticated branch if they are not already present:

```jsx
<Link
  to="/"
  onClick={() => setMobileOpen(false)}
  className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
>
  <Icon name="search" size="md" className="text-brand-primary-600" />
  Tìm gia sư
</Link>
<Link
  to="/services"
  onClick={() => setMobileOpen(false)}
  className="flex items-center gap-3 rounded-brand-md px-3 py-2.5 text-body-reg font-semibold text-neutral-700 hover:bg-neutral-100"
>
  <Icon name="local_library" size="md" className="text-brand-primary-600" />
  Dịch vụ
</Link>
```

- [ ] **Step 6: Verify the topbar.**

Run:

```powershell
npm run lint
npm run build
```

Then start the dev server and check at 1440px, 1024px, 768px, and 390px:

- At `lg` and above, the nav is centered; guest order is `Tìm gia sư`, `Dịch vụ`, `Trở thành gia sư`, `Cách hoạt động`.
- At 1024px the nav is visible and the hamburger is hidden.
- Below 1024px the nav is hidden; the hamburger opens a drawer with the same guest order.
- The active route has a cobalt underline, not a filled pill.
- The guest right side has only `Đăng ký` and `Đăng nhập`; no duplicate `Trở thành gia sư`.

- [ ] **Step 7: Commit.**

```powershell
git add src/frontend/src/components/layout/PublicTopbar.jsx
git commit -m "feat: center public nav and add tutor link"
```

---

## Task 4: Refactor the Hero

**Files**
- Modify: `src/frontend/src/components/discovery/HeroSection.jsx`
- Modify: `src/frontend/src/pages/discovery/Marketplace.jsx` (pass `totalCount` later in Task 8; this task keeps the prop optional)

**Why:** The approved hero is left-aligned and editorial, with a trust rail on desktop. The search input, clear button, submit behavior, and popular-tag search behavior stay the same. `totalCount` is optional so the component can render before Task 8 wires it.

- [ ] **Step 1: Replace the entire hero component.**

Replace `src/frontend/src/components/discovery/HeroSection.jsx` with:

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Input from '@/components/ui/Input';

const POPULAR_TAGS = [
  { label: 'Toán', query: 'Toán' },
  { label: 'IELTS', query: 'IELTS' },
  { label: 'Lập trình', query: 'Lập trình' },
  { label: 'Vật lý', query: 'Vật lý' },
];

const TRUST_STEPS = [
  {
    icon: 'verified_user',
    title: 'Chọn gia sư đã xác minh',
    body: 'Học vấn, chứng chỉ và đánh giá thật.',
  },
  {
    icon: 'event_available',
    title: 'Đặt lịch và giữ chỗ 15 phút',
    body: 'Chọn buổi học phù hợp với lịch của bạn.',
  },
  {
    icon: 'payments',
    title: 'Học xong, tiền mới giải ngân',
    body: 'TutorHub giữ học phí đến khi buổi học hoàn tất.',
  },
];

export default function HeroSection({
  searchKeyword,
  setSearchKeyword,
  onSearchSubmit,
  totalCount,
}) {
  const count = Number(totalCount);
  const countLabel =
    Number.isFinite(count) && count > 0
      ? `${new Intl.NumberFormat('vi-VN').format(count)} hồ sơ`
      : null;

  const handleTagClick = (query) => {
    setSearchKeyword(query);
    onSearchSubmit(query);
  };

  return (
    <section className="border-b border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)]">
      <div className="page-shell">
        <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:items-start lg:gap-11 lg:py-11">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-[color:var(--mkt-cobalt)]" aria-hidden="true" />
              <span className="mkt-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--mkt-muted)]">
                Gia sư đã xác minh{countLabel ? ` · ${countLabel}` : ''}
              </span>
            </div>

            <h1 className="mkt-display mt-4 max-w-[580px] text-[29px] leading-[1.12] tracking-[-0.045em] text-[color:var(--mkt-ink)] sm:text-[38px] lg:text-[44px] lg:leading-[1.1]">
              Tìm người dạy đúng điều{' '}
              <span className="mkt-highlight">bạn cần học.</span>
            </h1>

            <p className="mt-4 max-w-[560px] text-[13px] leading-relaxed text-[color:var(--mkt-body)] sm:text-[14px]">
              Hồ sơ rõ ràng, lịch học linh hoạt và học phí được giữ an toàn cho đến khi
              buổi học hoàn tất.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit(searchKeyword);
              }}
              className="mt-7 flex min-h-[48px] w-full max-w-[660px] items-center rounded-[10px] border border-[color:var(--mkt-line)] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[color:var(--mkt-cobalt)] focus-within:ring-2 focus-within:ring-[color:var(--mkt-cobalt)]/15"
              role="search"
              aria-label="Tìm kiếm gia sư"
            >
              <span className="pointer-events-none pl-3.5 pr-2 text-[color:var(--mkt-muted)]">
                <Icon name="search" size="md" strokeWidth={1.7} />
              </span>

              <Input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm môn học hoặc gia sư…"
                aria-label="Từ khóa tìm kiếm gia sư"
                className="h-full !w-auto min-w-0 flex-1 !border-none !bg-transparent px-1 text-[14px] !shadow-none placeholder:text-[color:var(--mkt-muted)] focus:!ring-0"
              />

              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    onSearchSubmit('');
                  }}
                  className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-[8px] text-[color:var(--mkt-muted)] transition-colors hover:bg-[color:var(--mkt-canvas)] hover:text-[color:var(--mkt-ink)]"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <Icon name="close" size="sm" strokeWidth={1.7} />
                </button>
              )}

              <button
                type="submit"
                className="inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-[color:var(--mkt-cobalt)] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[color:var(--mkt-cobalt-hover)] sm:h-11 sm:min-h-11 sm:min-w-[128px] sm:px-5"
                aria-label="Tìm gia sư"
              >
                <span className="hidden sm:inline">Tìm gia sư</span>
                <Icon name="arrow_forward" size="xs" strokeWidth={1.7} />
              </button>
            </form>

            <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
              <span className="text-[10.5px] font-medium text-[color:var(--mkt-muted)]">
                Phổ biến:
              </span>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleTagClick(tag.query)}
                  className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--mkt-line)] bg-white px-3 py-1 text-[10.5px] font-semibold text-[color:var(--mkt-body)] transition-colors hover:border-[color:var(--mkt-cobalt-100)] hover:text-[color:var(--mkt-cobalt)]"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-[14px] border border-[color:var(--mkt-line)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)]">
                  <Icon name="shield" size="sm" strokeWidth={1.7} />
                </span>
                <div>
                  <h2 className="mkt-display text-[13.5px] font-extrabold tracking-[-0.02em] text-[color:var(--mkt-ink)]">
                    Học an toàn từ buổi đầu tiên
                  </h2>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-[color:var(--mkt-body)]">
                    Ba bước, mỗi bước đều có bằng chứng.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {TRUST_STEPS.map((step, index) => (
                  <div key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
                    {index < TRUST_STEPS.length - 1 && (
                      <span
                        className="absolute left-[9px] top-5 h-[calc(100%-8px)] w-px bg-[color:var(--mkt-line)]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-[color:var(--mkt-cobalt-100)] bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)]">
                      <Icon name={step.icon} size="xs" strokeWidth={1.7} className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold leading-snug text-[color:var(--mkt-ink)]">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-[color:var(--mkt-body)]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/how-it-works"
                className="mt-4 inline-flex items-center gap-1.5 border-t border-[color:var(--mkt-line)] pt-3 text-[11px] font-semibold text-[color:var(--mkt-cobalt)] hover:underline"
              >
                Tìm hiểu cách bảo chứng
                <Icon name="arrow_forward" size="xs" strokeWidth={1.7} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  searchKeyword: PropTypes.string.isRequired,
  setSearchKeyword: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  totalCount: PropTypes.number,
};
```

- [ ] **Step 2: Verify the hero in isolation.**

Run:

```powershell
npm run lint
npm run build
```

Start the dev server and check:

- Desktop: left-aligned headline with the cobalt highlight on `bạn cần học.`; trust rail on the right; search is one row.
- Mobile: trust rail hidden; popular tags hidden; search button collapses to an icon-only 40px square; clear button appears only when there is text.
- Submitting the form still updates the query string through `onSearchSubmit`; clicking a popular tag fills the input and submits it.

- [ ] **Step 3: Commit.**

```powershell
git add src/frontend/src/components/discovery/HeroSection.jsx
git commit -m "feat: rebuild marketplace hero with trust rail"
```

---

## Task 5: Refactor the Category Bar

**Files**
- Modify: `src/frontend/src/components/discovery/CategoryFilterBar.jsx`

**Why:** Keep the existing data-driven order, `Khác` dropdown, and category selection behavior, but replace filled pills with bare icons and an underline active state. The old `role="tablist"`/`role="tab"` semantics were incomplete because the `Khác` trigger is not a tab; use a labelled group with `aria-pressed` instead.

- [ ] **Step 1: Replace the entire category bar.**

Replace `src/frontend/src/components/discovery/CategoryFilterBar.jsx` with:

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/cn';
import Icon from '@/components/ui/Icon';

const ICON_BY_CATEGORY_NAME = {
  'Toán học': 'calculate',
  'Ngoại ngữ': 'translate',
  'Khoa học tự nhiên': 'science',
  'Công nghệ thông tin': 'terminal',
  'Khoa học xã hội': 'auto_stories',
  'Nghệ thuật & Âm nhạc': 'celebration',
  'Kỹ năng mềm': 'group',
  'Luyện thi chứng chỉ': 'military_tech',
  'Kinh tế & Tài chính': 'account_balance',
  'Thể thao & Yoga': 'rocket_launch',
};

export default function CategoryFilterBar({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
}) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { mainCategories, otherCategories, activeOtherCategory } = React.useMemo(() => {
    const list = Array.isArray(categories) ? [...categories] : [];
    const priorityKeywords = [
      'Công nghệ thông tin',
      'Khoa học tự nhiên',
      'Khoa học xã hội',
      'Kinh tế & Tài chính',
      'Kỹ năng mềm',
      'Ngoại ngữ',
    ];

    const mains = [];
    const others = [];

    list.forEach((cat) => {
      const isPriority = priorityKeywords.some((pk) =>
        cat.name.toLowerCase().includes(pk.toLowerCase())
      );
      if (isPriority && mains.length < 6) {
        const displayName = cat.name.includes('Công nghệ thông tin') ? 'CNTT' : cat.name;
        mains.push({ ...cat, displayName, icon: ICON_BY_CATEGORY_NAME[cat.name] || 'auto_stories' });
      } else {
        others.push({ ...cat, displayName: cat.name, icon: ICON_BY_CATEGORY_NAME[cat.name] || 'category' });
      }
    });

    const activeOther = others.find((c) => c.id === selectedCategoryId);
    return { mainCategories: mains, otherCategories: others, activeOtherCategory: activeOther };
  }, [categories, selectedCategoryId]);

  const tabClass = (active) =>
    cn(
      'inline-flex min-h-[46px] shrink-0 items-center gap-2 border-b-2 px-2.5 text-[12.5px] font-semibold transition-colors',
      active
        ? 'border-[color:var(--mkt-cobalt)] text-[color:var(--mkt-cobalt)]'
        : 'border-transparent text-[color:var(--mkt-body)] hover:text-[color:var(--mkt-ink)]'
    );

  return (
    <div
      id="category-filter-bar"
      className="z-30 w-full border-y border-[color:var(--mkt-line)] bg-white"
    >
      <div className="page-shell">
        <div
          className="flex items-center gap-1 overflow-x-auto py-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Danh mục bộ môn"
        >
          <button
            type="button"
            id="category-tab-all"
            aria-pressed={!selectedCategoryId}
            onClick={() => {
              onSelectCategory('');
              setDropdownOpen(false);
            }}
            className={tabClass(!selectedCategoryId)}
          >
            <Icon
              name="auto_stories"
              size="xs"
              strokeWidth={1.7}
              className={
                !selectedCategoryId
                  ? 'text-[color:var(--mkt-cobalt)]'
                  : 'text-[color:var(--mkt-muted)]'
              }
            />
            <span>Tất cả môn học</span>
          </button>

          {mainCategories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onSelectCategory(isActive ? '' : cat.id);
                  setDropdownOpen(false);
                }}
                className={tabClass(isActive)}
              >
                <Icon
                  name={cat.icon}
                  size="xs"
                  strokeWidth={1.7}
                  className={
                    isActive ? 'text-[color:var(--mkt-cobalt)]' : 'text-[color:var(--mkt-muted)]'
                  }
                />
                <span>{cat.displayName}</span>
              </button>
            );
          })}

          {otherCategories.length > 0 && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className={cn(
                  'inline-flex min-h-[46px] shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[12.5px] font-semibold transition-colors',
                  activeOtherCategory
                    ? 'border-[color:var(--mkt-cobalt)] text-[color:var(--mkt-cobalt)]'
                    : 'border-transparent text-[color:var(--mkt-body)] hover:text-[color:var(--mkt-ink)]'
                )}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span>{activeOtherCategory ? activeOtherCategory.name : 'Khác'}</span>
                <Icon
                  name="expand_more"
                  size="xs"
                  strokeWidth={1.7}
                  className={cn(
                    'transition-transform duration-150',
                    activeOtherCategory
                      ? 'text-[color:var(--mkt-cobalt)]'
                      : 'text-[color:var(--mkt-muted)]',
                    dropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-[10px] border border-[color:var(--mkt-line)] bg-white py-1.5 shadow-lg animate-fadeIn">
                  {otherCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between px-3.5 py-2 text-left text-[12px] font-medium transition-colors hover:bg-[color:var(--mkt-canvas)]',
                          isSelected
                            ? 'bg-[color:var(--mkt-cobalt-50)] font-semibold text-[color:var(--mkt-cobalt)]'
                            : 'text-[color:var(--mkt-body)]'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon
                            name={cat.icon}
                            size="xs"
                            strokeWidth={1.7}
                            className={
                              isSelected
                                ? 'text-[color:var(--mkt-cobalt)]'
                                : 'text-[color:var(--mkt-muted)]'
                            }
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isSelected && (
                          <Icon
                            name="check"
                            size="xs"
                            strokeWidth={1.7}
                            className="shrink-0 text-[color:var(--mkt-cobalt)]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

CategoryFilterBar.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  selectedCategoryId: PropTypes.string.isRequired,
  onSelectCategory: PropTypes.func.isRequired,
};
```

- [ ] **Step 2: Verify the category bar.**

Run:

```powershell
npm run lint
npm run build
```

Check:

- The bar has hairline top and bottom borders.
- Active category is cobalt text with a 2px bottom rule; inactive items are slate text.
- The order still follows the priority list and `Khác` opens the same dropdown.
- Selecting a category toggles it off when clicked again; `Khác` closes on outside click.
- The `Tất cả môn học` button has `id="category-tab-all"` for the empty-state focus behavior later.

- [ ] **Step 3: Commit.**

```powershell
git add src/frontend/src/components/discovery/CategoryFilterBar.jsx
git commit -m "feat: restyle category bar with bare icons"
```

---

## Task 6: Refactor the Tutor Card

**Files**
- Modify: `src/frontend/src/components/discovery/TutorCard.jsx`

**Why:** The card must use the new editorial anatomy, show package-price semantics (`Giá gói từ` + `/ gói học`), show up to three subjects, and keep the same profile link and local favorite toggle.

- [ ] **Step 1: Replace the entire tutor card.**

Replace `src/frontend/src/components/discovery/TutorCard.jsx` with:

```jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/Button';
import Money from '@/components/ui/Money';
import { formatRating } from '@/utils/marketplaceHelpers';

export default function TutorCard({ tutor = {} }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const {
    id,
    fullName = 'Gia sư',
    avatarUrl,
    bio = '',
    education = '',
    university = '',
    major = '',
    experienceYears = 0,
    ratingAvg = 0,
    totalReviews = 0,
    subjects = [],
    minPrice = null,
    isVerified = false,
  } = tutor;

  const displayName = (fullName || '').trim() || 'Gia sư';

  const educationDisplay = useMemo(() => {
    const trimmedMajor = major?.trim();
    const trimmedUni = university?.trim();
    if (trimmedMajor && trimmedUni) return `${trimmedMajor} · ${trimmedUni}`;
    if (trimmedUni) return trimmedUni;
    if (trimmedMajor) return trimmedMajor;
    if (education?.trim()) return education.trim();
    return null;
  }, [major, university, education]);

  const normalizedSubjects = useMemo(() => {
    return (subjects || [])
      .map((s) => (typeof s === 'string' ? s : s?.name ?? s?.subjectName))
      .filter(Boolean);
  }, [subjects]);

  const rating = Number(ratingAvg ?? tutor.rating ?? 0);
  const reviewsCount = Number(totalReviews ?? 0);
  const yearsExp = Number(experienceYears ?? tutor.yearsOfExperience ?? 0);
  const packagePrice =
    minPrice != null
      ? Number(minPrice)
      : tutor.hourlyRate != null
      ? Number(tutor.hourlyRate)
      : null;

  const visibleSubjects = normalizedSubjects.slice(0, 3);
  const extraSubjects = normalizedSubjects.length - visibleSubjects.length;
  const hasRating = reviewsCount > 0 && Number.isFinite(rating) && rating > 0;

  return (
    <article className="mkt-card group flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={avatarUrl}
            name={displayName}
            size="md"
            className="h-[42px] w-[42px] shrink-0 ring-1 ring-neutral-200/80 sm:h-12 sm:w-12"
          />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                to={`/tutors/${id}`}
                className="truncate text-[13.5px] font-extrabold tracking-[-0.02em] text-[color:var(--mkt-ink)] transition-colors hover:text-[color:var(--mkt-cobalt)] sm:text-[15px]"
                title={displayName}
              >
                {displayName}
              </Link>
              {isVerified && (
                <Icon
                  name="verified"
                  size="xs"
                  filled
                  strokeWidth={1.7}
                  className="h-3.5 w-3.5 shrink-0 text-[color:var(--mkt-green)]"
                  label="Đã xác minh"
                />
              )}
            </div>

            {educationDisplay && (
              <p
                className="mt-0.5 truncate text-[10.5px] text-[color:var(--mkt-body)] sm:text-[11px]"
                title={educationDisplay}
              >
                {educationDisplay}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] text-[color:var(--mkt-body)]">
              {hasRating ? (
                <span className="inline-flex items-center gap-1">
                  <Icon
                    name="star"
                    size="xs"
                    filled
                    strokeWidth={1.7}
                    className="h-3 w-3 text-[color:var(--mkt-amber)]"
                  />
                  <strong className="mkt-tabular font-bold text-[color:var(--mkt-ink)]">
                    {formatRating(rating)}
                  </strong>
                  <span>({reviewsCount} đánh giá)</span>
                </span>
              ) : (
                <span className="rounded-full border border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)] px-2 py-0.5 text-[9.5px] font-semibold text-[color:var(--mkt-muted)]">
                  Chưa có đánh giá
                </span>
              )}
              {yearsExp > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className="text-[color:var(--mkt-line)]">
                    ·
                  </span>
                  <span>{yearsExp} năm</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {visibleSubjects.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1" aria-label="Môn học">
            {visibleSubjects.map((subject) => (
              <span
                key={subject}
                className="border-b border-[color:var(--mkt-line)] pb-0.5 text-[10.5px] font-semibold text-[color:var(--mkt-body)]"
              >
                {subject}
              </span>
            ))}
            {extraSubjects > 0 && (
              <span className="text-[10px] font-medium text-[color:var(--mkt-muted)]">
                +{extraSubjects} môn
              </span>
            )}
          </div>
        )}

        {bio?.trim() && (
          <p
            className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[color:var(--mkt-body)]"
            title={bio.trim()}
          >
            {bio.trim()}
          </p>
        )}

        <div className="mt-auto border-t border-[color:var(--mkt-line)] pt-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="mkt-mono text-[7.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--mkt-muted)]">
                Giá gói từ
              </p>
              {packagePrice && packagePrice > 0 ? (
                <div className="mt-0.5 flex items-baseline gap-1">
                  <Money
                    value={packagePrice}
                    className="mkt-tabular text-[16px] font-extrabold text-[color:var(--mkt-ink)]"
                  />
                  <span className="text-[8.5px] font-medium text-[color:var(--mkt-muted)]">
                    / gói học
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--mkt-body)]">
                  Xem chi tiết hồ sơ
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/tutors/${id}`}
                className="mkt-btn-primary h-11 min-h-11 px-3 text-[11px] sm:h-9 sm:min-h-9 sm:px-3"
              >
                <span>Xem hồ sơ</span>
                <Icon name="arrow_forward" size="xs" strokeWidth={1.7} />
              </Link>

              <IconButton
                label={isFavorite ? 'Bỏ lưu gia sư' : 'Lưu gia sư'}
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorite((v) => !v)}
                className="h-11 w-11 min-h-11 sm:h-9 sm:w-9 sm:min-h-9"
                icon={
                  <Icon
                    name="favorite"
                    size="xs"
                    filled={isFavorite}
                    strokeWidth={1.7}
                    className={
                      isFavorite
                        ? 'h-4 w-4 text-[color:var(--mkt-danger)]'
                        : 'h-4 w-4 text-[color:var(--mkt-muted)]'
                    }
                  />
                }
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

TutorCard.propTypes = {
  tutor: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string,
    bio: PropTypes.string,
    education: PropTypes.string,
    university: PropTypes.string,
    major: PropTypes.string,
    degreeLevel: PropTypes.string,
    ratingAvg: PropTypes.number,
    rating: PropTypes.number,
    totalReviews: PropTypes.number,
    experienceYears: PropTypes.number,
    yearsOfExperience: PropTypes.number,
    subjects: PropTypes.array,
    minPrice: PropTypes.number,
    hourlyRate: PropTypes.number,
    isVerified: PropTypes.bool,
  }).isRequired,
};
```

- [ ] **Step 2: Verify the card.**

Run:

```powershell
npm run lint
npm run build
```

Check:

- The card shows a 42px avatar on mobile and 48px from `sm`; the name truncates instead of wrapping.
- Rating uses `formatRating` (comma decimal), then review count, then years with `·`.
- Three subjects render with hairline underlines; a fourth subject becomes `+N môn`.
- Bio is two lines without quotation marks.
- Price label is exactly `Giá gói từ` and suffix is exactly `/ gói học`; fallback is `Xem chi tiết hồ sơ`.
- The CTA is 44px on mobile and 36px from `sm`; the heart is 44px on mobile and 36px from `sm`.
- The left cobalt rule is faint by default and full on hover/focus-within.

- [ ] **Step 3: Commit.**

```powershell
git add src/frontend/src/components/discovery/TutorCard.jsx
git commit -m "feat: rebuild tutor card with package price semantics"
```

---

## Task 7: Refactor the Filter Sidebar and Add the Drawer Panel Hook

**Files**
- Modify: `src/frontend/src/components/discovery/FilterSidebar.jsx`
- Modify: `src/frontend/src/components/ui/Avatar.jsx` (add optional `panelClassName` to `Drawer`)

**Why:** The sidebar keeps every control and every option. Only the visual treatment changes, plus an optional footer summary that the desktop page can pass and the drawer can omit. The `Drawer` portals to `document.body`, so it needs `panelClassName="marketplace-v2"` to inherit the scoped variables.

- [ ] **Step 1: Add the optional footer prop to `FilterSidebar`.**

Add `footer` to the destructured props after `onResetFilters`:

```js
  onResetFilters,
  footer,
  className,
```

Immediately before the `</div>` that closes the `.filter-panel` card (after the certification section, before `</aside>`), add:

```jsx
        {footer && (
          <div className="border-t border-[color:var(--mkt-line)] pt-3">
            {footer}
          </div>
        )}
```

Add to `FilterSidebar.propTypes`:

```js
  footer: PropTypes.node,
```

- [ ] **Step 2: Restyle the panel header.**

Replace the current panel opening and header block:

```jsx
      <div className="filter-panel flex flex-col gap-4 rounded-brand-lg border border-border bg-surface p-4 sm:p-5 shadow-brand-sm">
        {/* Header: gọn gàng 1 dòng không bao giờ xuống hàng */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-brand-md bg-brand-primary-50 text-brand-primary-700">
              <Icon name="tune" size="xs" />
            </span>
            <span className="font-bold text-[15px] text-neutral-900">Bộ lọc</span>
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary-600 px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[12.5px] font-semibold text-neutral-500 transition-colors hover:text-danger cursor-pointer py-1 px-1.5 rounded-md hover:bg-neutral-50"
            >
              Đặt lại
            </button>
          )}
        </div>
```

with:

```jsx
      <div className="filter-panel flex flex-col gap-4 rounded-[14px] border border-[color:var(--mkt-line)] bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-[color:var(--mkt-line)] pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon
              name="tune"
              size="sm"
              strokeWidth={1.7}
              className="text-[color:var(--mkt-cobalt)]"
            />
            <span className="text-[12px] font-bold text-[color:var(--mkt-ink)]">Bộ lọc</span>
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--mkt-cobalt)] px-1.5 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex min-h-11 items-center rounded-[8px] px-2 text-[11px] font-semibold text-[color:var(--mkt-body)] transition-colors hover:bg-[color:var(--mkt-canvas)] hover:text-[color:var(--mkt-danger)]"
            >
              Đặt lại
            </button>
          )}
        </div>
```

- [ ] **Step 3: Apply the repeated section-header and option-state replacements.**

Use the editor's replace-all for each of these exact strings.

Section title (six occurrences):

```text
flex w-full cursor-pointer items-center justify-between text-[13.5px] font-bold text-neutral-900 group
```

becomes:

```text
flex min-h-11 w-full cursor-pointer items-center justify-between text-[12px] font-bold text-[color:var(--mkt-ink)] group
```

Section icon hover (five occurrences; do not change the rating icon in the next bullet):

```text
text-neutral-400 transition-colors group-hover:text-brand-primary-600
```

becomes:

```text
text-[color:var(--mkt-muted)] transition-colors group-hover:text-[color:var(--mkt-cobalt)]
```

Rating icon (one occurrence):

```text
text-neutral-400 transition-colors group-hover:text-brand-secondary-500
```

becomes:

```text
text-[color:var(--mkt-muted)] transition-colors group-hover:text-[color:var(--mkt-amber)]
```

Chevron (six occurrences):

```text
text-neutral-400 transition-transform duration-200
```

becomes:

```text
text-[color:var(--mkt-muted)] transition-transform duration-200
```

Section top border (five occurrences):

```text
border-t border-neutral-100/80 pt-3
```

becomes:

```text
border-t border-[color:var(--mkt-line)] pt-3
```

Section content text size (five occurrences):

```text
space-y-1 pt-1 text-[13px]
```

becomes:

```text
space-y-1 pt-1 text-[12px]
```

- [ ] **Step 4: Restyle the price section.**

Replace every occurrence of:

```text
rounded-brand-md border border-neutral-200/90 bg-neutral-50/70 p-2
```

with:

```text
rounded-[8px] border border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)] p-2
```

Replace every occurrence of:

```text
text-[11px] font-medium text-neutral-500
```

with:

```text
text-[9.5px] font-medium text-[color:var(--mkt-muted)]
```

Replace the min-price value class:

```text
font-mono text-[13px] font-bold text-neutral-900 truncate
```

with:

```text
mkt-mono text-[12px] font-bold text-[color:var(--mkt-ink)] truncate
```

Replace the max-price value class:

```text
font-mono text-[13px] font-bold text-brand-primary-700 truncate
```

with:

```text
mkt-mono text-[12px] font-bold text-[color:var(--mkt-cobalt)] truncate
```

In the price preset button class, replace:

```text
min-h-[36px] rounded-brand-md border px-2 py-1 text-[12px] transition-all font-medium text-center
```

with:

```text
min-h-[36px] rounded-[8px] border px-2 py-1 text-[11.5px] transition-all font-medium text-center
```

Replace the selected preset classes:

```text
border-brand-primary-600 bg-brand-primary-50 text-brand-primary-700 font-semibold shadow-xs
```

with:

```text
border-[color:var(--mkt-cobalt)] bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)] font-semibold
```

Replace the unselected preset classes:

```text
border-neutral-200 bg-surface text-neutral-600 hover:border-neutral-300 hover:text-neutral-900
```

with:

```text
border-[color:var(--mkt-line)] bg-white text-[color:var(--mkt-body)] hover:border-[color:var(--mkt-cobalt-100)] hover:text-[color:var(--mkt-ink)]
```

- [ ] **Step 5: Restyle the radio option rows.**

Replace every occurrence of:

```text
flex items-center gap-2.5 px-2.5 py-1.5 rounded-brand-md cursor-pointer select-none transition-colors text-[13px]
```

with:

```text
flex min-h-11 items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[12px] cursor-pointer select-none transition-colors
```

First replace the bordered selected/unselected states. These strings contain the shorter plain strings, so doing them first prevents the next replacements from destroying their prefixes.

Replace every occurrence of the selected bordered state:

```text
bg-brand-primary-50 text-brand-primary-700 font-semibold border border-brand-primary-200/80
```

with:

```text
bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)] font-semibold border border-[color:var(--mkt-cobalt-100)]
```

Replace every occurrence of the unselected bordered state:

```text
text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent
```

with:

```text
text-[color:var(--mkt-body)] hover:bg-[color:var(--mkt-canvas)] hover:text-[color:var(--mkt-ink)] border border-transparent
```

Then replace the plain states:

Replace every occurrence of:

```text
bg-brand-primary-50 text-brand-primary-700 font-semibold
```

with:

```text
bg-[color:var(--mkt-cobalt-50)] text-[color:var(--mkt-cobalt)] font-semibold
```

Replace every occurrence of:

```text
text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900
```

with:

```text
text-[color:var(--mkt-body)] hover:bg-[color:var(--mkt-canvas)] hover:text-[color:var(--mkt-ink)]
```

Replace the degree row base class:

```text
flex items-center justify-between px-2.5 py-1.5 rounded-brand-md cursor-pointer transition-all select-none text-[12.5px]
```

with:

```text
flex min-h-11 items-center justify-between rounded-[8px] px-2.5 py-1.5 text-[12px] cursor-pointer transition-all select-none
```

Replace every occurrence of:

```text
flex items-center gap-2 px-2.5 py-1.5 rounded-brand-md cursor-pointer select-none transition-colors text-[12.5px]
```

with:

```text
flex min-h-11 items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px] cursor-pointer select-none transition-colors
```

Replace every occurrence of the larger radio class:

```text
w-4 h-4 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer
```

with:

```text
h-4 w-4 cursor-pointer border-neutral-300 accent-[color:var(--mkt-cobalt)] focus:ring-[color:var(--mkt-cobalt)]
```

Replace every occurrence of the smaller radio class:

```text
w-3.5 h-3.5 text-brand-primary-600 border-neutral-300 focus:ring-brand-primary-600 cursor-pointer
```

with:

```text
h-3.5 w-3.5 cursor-pointer border-neutral-300 accent-[color:var(--mkt-cobalt)] focus:ring-[color:var(--mkt-cobalt)]
```

- [ ] **Step 6: Restyle the university search.**

Replace:

```text
w-full px-2.5 py-1.5 text-[12px] bg-neutral-50 border border-neutral-200 rounded-brand-md focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand-primary-600
```

with:

```text
w-full rounded-[8px] border border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)] px-2.5 py-1.5 text-[12px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[color:var(--mkt-cobalt)]
```

Replace the clear-search button class:

```text
absolute right-1 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600
```

with:

```text
absolute right-1 top-1/2 -translate-y-1/2 p-1 text-[color:var(--mkt-muted)] hover:text-[color:var(--mkt-ink)]
```

- [ ] **Step 7: Add the optional panel class to `Drawer`.**

In `src/frontend/src/components/ui/Avatar.jsx`, change the `Drawer` signature from:

```js
export function Drawer({ open, onClose, side = 'left', title, widthClass = 'w-80', footer, children }) {
```

to:

```js
export function Drawer({ open, onClose, side = 'left', title, widthClass = 'w-80', panelClassName, footer, children }) {
```

In the `aside` className `cn(...)`, add `panelClassName` after `widthClass`:

```js
          widthClass,
          panelClassName,
          side === 'left' ? 'left-0' : 'right-0'
```

- [ ] **Step 8: Verify the sidebar.**

Run:

```powershell
npm run lint
npm run build
```

Check:

- The panel is a 14px white card with a hairline border and no shadow.
- Every control still works: price slider, price presets, rating radio, experience radio, degree radio, university search/radio, certification radio, reset.
- Active rows use cobalt-50/cobalt; inactive rows use slate body text.
- The desktop footer slot renders only when `footer` is passed; the drawer can omit it.
- The `Drawer` still works for other callers because `panelClassName` is optional.

- [ ] **Step 9: Commit.**

```powershell
git add src/frontend/src/components/discovery/FilterSidebar.jsx src/frontend/src/components/ui/Avatar.jsx
git commit -m "feat: restyle marketplace filters and add drawer panel hook"
```

---

## Task 8: Recompose the Marketplace Page

**Files**
- Create: `src/frontend/src/components/discovery/MarketplaceCardSkeleton.jsx`
- Modify: `src/frontend/src/components/common/EmptyState.jsx` (add an optional secondary action)
- Modify: `src/frontend/src/pages/discovery/Marketplace.jsx`

**Why:** This task connects the new pieces: scoped wrapper, 272px sidebar, sticky mobile filter/sort bar, active-filter summary, quick chips, skeleton, empty/error states, pagination range, and the mobile drawer summary.

- [ ] **Step 1: Create the matching loading skeleton.**

Create `src/frontend/src/components/discovery/MarketplaceCardSkeleton.jsx`:

```jsx
import React from 'react';
import { cn } from '@/lib/cn';

const BAR = 'rounded bg-neutral-200/80 animate-pulse';

export default function MarketplaceCardSkeleton({ count = 6 }) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách gia sư..."
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="mkt-card flex h-full flex-col p-4 pl-5 sm:p-5 sm:pl-6"
        >
          <div className="flex items-start gap-3">
            <div className={cn(BAR, 'h-[42px] w-[42px] shrink-0 rounded-full sm:h-12 sm:w-12')} />
            <div className="flex-1 space-y-2">
              <div className={cn(BAR, 'h-3.5 w-2/3')} />
              <div className={cn(BAR, 'h-2.5 w-1/2')} />
              <div className={cn(BAR, 'h-2.5 w-1/3')} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className={cn(BAR, 'h-2.5 w-4/5')} />
            <div className={cn(BAR, 'h-2.5 w-3/5')} />
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-[color:var(--mkt-line)] pt-3">
            <div className={cn(BAR, 'h-3 w-20')} />
            <div className={cn(BAR, 'h-9 w-24 rounded-[8px]')} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add the optional secondary action to `EmptyState`.**

In `src/frontend/src/components/common/EmptyState.jsx`, add `secondaryActionLabel` and `onSecondaryAction` to the props after `onAction`:

```js
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
```

Replace the current action block:

```jsx
      {(actionLabel && (actionPath || onAction)) && (
        <div className="pt-2">
          {actionPath ? (
            <Button as={Link} to={actionPath} variant="primary" size="md">
              {actionLabel}
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
```

with:

```jsx
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row">
          {actionLabel && (actionPath || onAction) && (
            actionPath ? (
              <Button as={Link} to={actionPath} variant="primary" size="md" className="w-full sm:w-auto">
                {actionLabel}
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={onAction} className="w-full sm:w-auto">
                {actionLabel}
              </Button>
            )
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              size="md"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
```

This is backward compatible: existing callers that do not pass the new props render exactly one primary button as before.

- [ ] **Step 3: Update imports, helpers, refs, and timeout trace ID.**

In `src/frontend/src/pages/discovery/Marketplace.jsx`:

1. Change the React import to include `useRef`:

```js
import React, { useState, useEffect, useMemo, useRef } from 'react';
```

2. Remove the `CardSkeleton` import and the `cn` import. Ensure the scoped stylesheet import from Task 2 is present, and add:

```js
import MarketplaceCardSkeleton from '@/components/discovery/MarketplaceCardSkeleton';
import { getPaginationRange, formatCount } from '@/utils/marketplaceHelpers';
```

3. Add a results ref after the `isMobileFilters` state:

```js
  const resultsRef = useRef(null);
```

4. In the timeout branch, attach the correlation ID to the error so `ErrorState` can show the trace ID:

```js
          const timeoutErr = new ApiError(
            'Yêu cầu quá thời gian (10 giây). Vui lòng kiểm tra kết nối mạng và bấm Thử Lại.',
            { status: 0, kind: 'network' }
          );
          timeoutErr.traceId = correlationId;
```

5. After `const totalPages = ...`, add:

```js
  const pageRange = getPaginationRange(pageNumber, pageSize, totalCount);
```

- [ ] **Step 4: Replace the page-change handler and add the category exploration handler.**

Replace the current `handlePageChange` with:

```js
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPageNumber(newPage);
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior, block: 'start' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior });
    }
  };

  const handleExploreCategories = () => {
    setSelectedCategory('');
    setPageNumber(1);
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('category-filter-bar')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('category-tab-all')?.focus({ preventScroll: true });
  };
```

- [ ] **Step 5: Turn the shared sidebar element into a render function with an optional footer.**

Replace `const filterSidebar = (` with:

```js
  const renderFilterSidebar = (extraProps = {}) => (
```

Keep every existing `FilterSidebar` prop unchanged. At the end of the element, replace:

```jsx
      onResetFilters={handleResetFilters}
    />
  );
```

with:

```jsx
      onResetFilters={handleResetFilters}
      {...extraProps}
    />
  );
```

Then the desktop column calls `renderFilterSidebar({ footer: <...> })`; the drawer calls `renderFilterSidebar()`. The footer summary is added in the layout step below.

- [ ] **Step 6: Replace the page wrapper, hero, category bar, layout, and mobile sticky bar.**

Replace the block from the current `return (` through the old mobile filter trigger `</div>` (the `lg:hidden` block that contains the “Bộ lọc” button) with:

```jsx
  return (
    <div className="marketplace-v2 w-full flex-1 pb-12">
      <HeroSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        totalCount={totalCount}
        onSearchSubmit={(val) => {
          setDebouncedKeyword(val);
          setPageNumber(1);
          if (val) setSearchParams({ q: val });
          else setSearchParams({});
        }}
      />

      <CategoryFilterBar
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          setPageNumber(1);
        }}
      />

      <main className="page-shell pt-7 sm:pt-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[272px_minmax(0,1fr)]">
          {!isMobileFilters && (
            <div className="z-20 w-full lg:sticky lg:top-[88px]">
              {renderFilterSidebar({
                footer: (
                  <div className="flex items-center justify-between gap-2 text-[10.5px] text-[color:var(--mkt-body)]">
                    <span>
                      Đang áp dụng{' '}
                      <strong className="font-bold text-[color:var(--mkt-ink)]">
                        {activeFilters.length}
                      </strong>{' '}
                      bộ lọc
                    </span>
                    <span>
                      <strong className="font-bold text-[color:var(--mkt-ink)]">
                        {formatCount(totalCount)}
                      </strong>{' '}
                      kết quả
                    </span>
                  </div>
                ),
              })}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-4">
            {/* Mobile sticky toolbar: filter + sort */}
            <div className="sticky top-[72px] z-30 -mx-4 mb-3 flex items-center justify-between gap-3 border-b border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)]/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-[color:var(--mkt-line)] bg-white px-3.5 text-[12px] font-bold text-[color:var(--mkt-ink)] shadow-sm transition-colors hover:border-[color:var(--mkt-cobalt-100)]"
              >
                <Icon
                  name="tune"
                  size="sm"
                  strokeWidth={1.7}
                  className="text-[color:var(--mkt-cobalt)]"
                />
                <span>Bộ lọc</span>
                {activeFilters.length > 0 && (
                  <span
                    role="status"
                    aria-label={`${activeFilters.length} bộ lọc đang áp dụng`}
                    className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--mkt-cobalt)] px-1 text-[9px] font-bold text-white"
                  >
                    {activeFilters.length}
                  </span>
                )}
              </button>

              <div className="w-[148px] shrink-0">
                <Select
                  id="sort-tutors-mobile"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPageNumber(1);
                  }}
                  aria-label="Sắp xếp gia sư"
                  className="min-h-11 !rounded-[8px] !border-[color:var(--mkt-line)] !bg-white !py-1.5 !text-[11px] font-semibold"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
```

The rest of the right column stays in place until the next step.

- [ ] **Step 7: Replace the active-filter bar and top toolbar.**

Replace the old active-filter bar and toolbar block (from `{activeFilters.length > 0 && (` through the closing `</div>` of the toolbar that contains `id="sort-tutors"`) with:

```jsx
            {activeFilters.length > 0 && (
              <div className="hidden flex-wrap items-center gap-2 rounded-[10px] border border-[color:var(--mkt-line)] bg-white p-3 lg:flex">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--mkt-ink)]">
                  <Icon
                    name="filter_alt"
                    size="xs"
                    strokeWidth={1.7}
                    className="h-3.5 w-3.5 text-[color:var(--mkt-cobalt)]"
                  />
                  <span>Đang lọc:</span>
                </div>

                {activeFilters.map((af) => (
                  <span
                    key={af.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--mkt-line)] bg-[color:var(--mkt-canvas)] px-2.5 py-1 text-[10.5px] font-semibold text-[color:var(--mkt-body)]"
                  >
                    <span>{af.label}</span>
                    <button
                      type="button"
                      onClick={af.clear}
                      aria-label={`Xóa bộ lọc ${af.label}`}
                      className="-my-3 -mr-3 ml-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[13px] font-bold leading-none text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-danger)]"
                      title="Gỡ bộ lọc này"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-auto inline-flex min-h-11 items-center gap-1 px-2 text-[11px] font-semibold text-[color:var(--mkt-muted)] transition-colors hover:text-[color:var(--mkt-danger)]"
                >
                  <Icon name="close" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              </div>
            )}

            <div
              ref={resultsRef}
              className="flex scroll-mt-[88px] flex-row items-center justify-between gap-3 border-b border-[color:var(--mkt-line)] pb-3 pt-1"
            >
              <div>
                <h2
                  className="mkt-display text-[18px] font-extrabold tracking-[-0.03em] text-[color:var(--mkt-ink)] sm:text-[21px]"
                  aria-live="polite"
                >
                  {loading ? 'Đang tìm kiếm gia sư...' : `${formatCount(totalCount)} gia sư phù hợp`}
                </h2>
                <p className="mt-0.5 hidden text-[10.5px] text-[color:var(--mkt-body)] sm:block">
                  Xếp theo độ phù hợp với nhu cầu của bạn.
                </p>
                {activeFilters.length > 0 && (
                  <p className="mt-0.5 text-[10.5px] text-[color:var(--mkt-body)] lg:hidden">
                    Đã lọc theo {activeFilters.length} tiêu chí
                  </p>
                )}
              </div>

              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                <label
                  htmlFor="sort-tutors"
                  className="text-[10.5px] font-semibold text-[color:var(--mkt-body)]"
                >
                  Sắp xếp:
                </label>
                <div className="w-52">
                  <Select
                    id="sort-tutors"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPageNumber(1);
                    }}
                    className="min-h-11 !rounded-[8px] !border-[color:var(--mkt-line)] !bg-white !py-1.5 !text-[11px] font-semibold"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
```

- [ ] **Step 8: Replace the quick chips with the shared chip class and add the experience chip.**

Replace the old quick-filter block (from the `{/* Quick filter chips ... */}` comment through its closing `</div>`) with:

```jsx
            <div
              className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Bộ lọc nhanh"
            >
              <span className="shrink-0 text-[11px] font-semibold text-[color:var(--mkt-body)]">
                Lọc nhanh:
              </span>

              <button
                type="button"
                aria-pressed={maxPrice <= QUICK_PRICE_CAP && minPrice === 0}
                onClick={() => {
                  if (maxPrice <= QUICK_PRICE_CAP && minPrice === 0) {
                    setMinPrice(0);
                    setMaxPrice(MAX_PRICE);
                  } else {
                    setMinPrice(0);
                    setMaxPrice(QUICK_PRICE_CAP);
                  }
                  setPageNumber(1);
                }}
                className="mkt-chip"
              >
                <Icon name="payments" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                <span>Dưới 1 triệu</span>
              </button>

              <button
                type="button"
                aria-pressed={minRating === QUICK_RATING}
                onClick={() => {
                  setMinRating(minRating === QUICK_RATING ? null : QUICK_RATING);
                  setPageNumber(1);
                }}
                className="mkt-chip"
              >
                <Icon name="star" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                <span>Đánh giá từ 4.8</span>
              </button>

              <button
                type="button"
                aria-pressed={experienceRange === '3-5'}
                onClick={() => {
                  setExperienceRange(experienceRange === '3-5' ? 'All' : '3-5');
                  setPageNumber(1);
                }}
                className="mkt-chip"
              >
                <Icon name="work_history" size="xs" strokeWidth={1.7} className="h-3.5 w-3.5" />
                <span>3–5 năm</span>
              </button>
            </div>
```

- [ ] **Step 9: Replace the loading, error, empty, grid, and pagination block.**

Replace the current `{loading ? (` through the closing pagination block with:

```jsx
            {loading ? (
              <MarketplaceCardSkeleton count={6} />
            ) : error ? (
              <ErrorState
                error={error}
                title="Không thể tải danh sách gia sư"
                message={error.message}
                onRetry={handleRetry}
                backPath="/"
                backLabel="Về trang chủ"
                className="!max-w-xl !border-[color:var(--mkt-line)] !bg-white"
              />
            ) : tutors.length === 0 ? (
              <EmptyState
                icon="person_search"
                title="Không tìm thấy gia sư phù hợp"
                description="Bộ lọc hiện tại quá hẹp. Hãy thử nới khoảng học phí, chọn danh mục khác, hoặc gỡ bớt từng bộ lọc bên dưới."
                filters={activeFilters}
                actionLabel="Xóa bộ lọc"
                onAction={handleResetFilters}
                secondaryActionLabel="Khám phá danh mục"
                onSecondaryAction={handleExploreCategories}
                className="!max-w-xl !border-[color:var(--mkt-line)] !bg-white"
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {tutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-[color:var(--mkt-line)] pt-5 sm:flex-row">
                <p className="text-[10.5px] text-[color:var(--mkt-body)]">
                  Hiển thị {formatCount(pageRange.start)}–{formatCount(pageRange.end)} trong{' '}
                  {formatCount(totalCount)} gia sư
                </p>
                <div className="mkt-pagination">
                  <Pagination
                    page={pageNumber}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                    onPageChange={handlePageChange}
                    className="!mt-0"
                  />
                </div>
              </div>
            )}
```

- [ ] **Step 10: Replace the mobile drawer with the scoped panel, summary, and footer.**

Replace the current `<Drawer ...>...</Drawer>` block with:

```jsx
        <Drawer
          open={filterOpen && isMobileFilters}
          onClose={() => setFilterOpen(false)}
          side="left"
          title="Bộ lọc tìm kiếm"
          widthClass="w-[320px]"
          panelClassName="marketplace-v2"
          footer={
            <>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] border border-[color:var(--mkt-line)] bg-white px-4 text-[12px] font-bold text-[color:var(--mkt-body)] transition-colors hover:border-[color:var(--mkt-cobalt-100)]"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-[8px] bg-[color:var(--mkt-cobalt)] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[color:var(--mkt-cobalt-hover)]"
              >
                <span>{loading ? 'Đang tìm...' : `Xem ${formatCount(totalCount)} gia sư`}</span>
              </button>
            </>
          }
        >
          <div className="space-y-3">
            {activeFilters.length > 0 && (
              <div className="rounded-[10px] border border-[color:var(--mkt-cobalt-100)] bg-[color:var(--mkt-cobalt-50)] p-3">
                <p className="text-[10.5px] font-bold text-[color:var(--mkt-ink)]">
                  Đang áp dụng {activeFilters.length} bộ lọc
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeFilters.map((af) => (
                    <span
                      key={af.key}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--mkt-cobalt-100)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[color:var(--mkt-cobalt)]"
                    >
                      <span>{af.label}</span>
                      <button
                        type="button"
                        onClick={af.clear}
                        aria-label={`Xóa bộ lọc ${af.label}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] leading-none hover:bg-[color:var(--mkt-cobalt-50)]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {renderFilterSidebar()}
          </div>
        </Drawer>
```

- [ ] **Step 11: Verify the page.**

Run from `src/frontend`:

```powershell
npm test
npm run lint
npm run build
```

Then start the dev server and check at 1440px, 1024px, 768px, and 390px:

- The page has the `.marketplace-v2` canvas; no global token changed.
- Desktop grid is `272px + 1fr`; cards are 3 columns at `xl`, 2 at `md`, 1 below `md`.
- The desktop sidebar is sticky at `top: 88px`; the mobile sticky toolbar is at `top: 72px` and contains filter + sort.
- Quick chips toggle price, rating 4.8, and experience 3–5; all stay in sync with the sidebar.
- Active filter bar is desktop-only; the mobile drawer shows the same chips and removes them with `af.clear`.
- Pagination scrolls to the results toolbar, not to a fixed pixel; reduced-motion users get an instant jump.
- Loading shows six matching card skeletons; error shows a neutral card with a trace ID when the request times out; empty shows `Xóa bộ lọc` primary and `Khám phá danh mục` secondary.
- The empty-state `Khám phá danh mục` resets the category, scrolls to the category bar, and focuses `Tất cả môn học`.
- The mobile drawer inherits the marketplace palette because `panelClassName="marketplace-v2"` is applied to the portaled panel.
- No filter, sort, search, pagination, or API parameter behavior changed.

- [ ] **Step 12: Commit.**

```powershell
git add src/frontend/src/components/discovery/MarketplaceCardSkeleton.jsx src/frontend/src/components/common/EmptyState.jsx src/frontend/src/pages/discovery/Marketplace.jsx
git commit -m "feat: recompose marketplace with scoped layout and states"
```

---

## Task 9: Final Verification and Handoff

**Files:** none (verification only)

- [ ] **Step 1: Run every automated check in the current worktree.**

From `src/frontend`:

```powershell
npm test
npm run lint
npm run build
```

Expected:

- `npm test` runs `marketplaceHelpers`, `authPersistence`, and `idempotency`; all pass.
- `npm run lint` has no new errors. Warnings that already existed before this work may remain; compare with the baseline if needed.
- `npm run build` succeeds and writes `dist/`.

- [ ] **Step 2: Start the app and API.**

Follow `README.md` for the API/PostgreSQL/Redis setup if they are not already running. Then from `src/frontend`:

```powershell
npm run dev
```

Open the printed local URL and confirm the marketplace loads real tutors.

- [ ] **Step 3: Verify the responsive matrix.**

Check these viewports:

| Width | Expected |
| --- | --- |
| 1440px | 1240px content, 272px sidebar, 3 card columns, centered 4-link nav |
| 1280px | Same 3-column grid; sidebar still 272px |
| 1024px | Nav visible; 3-column card grid; sidebar visible |
| 768px | Nav hidden; hamburger drawer; 2 card columns; sticky filter/sort bar |
| 390px | 1 card column; 44px filter/sort controls; no horizontal page scroll |

At every width, confirm the topbar does not overlap the sticky mobile toolbar or the sticky desktop sidebar.

- [ ] **Step 4: Verify every filter and sort path.**

On the live marketplace, exercise:

- Search: type a keyword, submit, clear, and use a popular tag. Confirm `?q=` updates and the debounced request uses the same keyword.
- Category: select each main category, use `Khác`, and click the active category again to clear it.
- Price: drag both slider thumbs, use each preset, and use the `Dưới 1 triệu` quick chip.
- Rating: choose 4.8, 4.5, 4.0, and `Tất cả đánh giá`; use the `Đánh giá từ 4.8` quick chip.
- Experience: choose each range; use the `3–5 năm` quick chip.
- Degree, university search, and certification: choose each option and reset.
- Sort: choose all five sort options on desktop and mobile.
- Pagination: move forward/back; confirm the page scrolls to the results toolbar and the range line matches the visible cards.
- Reset: `Đặt lại`, `Xóa bộ lọc`, and the drawer `Xóa` all return to the same default state and page 1.

Expected: no filter changes the API contract; only presentation changed.

- [ ] **Step 5: Verify loading, empty, and error states.**

- Reload while throttling the network: six matching card skeletons appear.
- Search for a string that cannot match: the empty state shows active chips, primary `Xóa bộ lọc`, and secondary `Khám phá danh mục`; the secondary action scrolls to the category bar and focuses `Tất cả môn học`.
- Stop the API or use DevTools offline and reload: the neutral error card appears with `Thử Lại` and `Về trang chủ`; a timeout shows a trace ID.
- Restore the API and click `Thử Lại`: results load without a full page reload.

- [ ] **Step 6: Verify the shared topbar on other public routes.**

Open `/`, `/services`, `/become-tutor`, `/how-it-works`, and a tutor detail route. Confirm:

- The nav is centered at `lg+` and the guest order is `Tìm gia sư`, `Dịch vụ`, `Trở thành gia sư`, `Cách hoạt động`.
- The active route uses the underline, not the old filled pill.
- The right side has no duplicate `Trở thành gia sư`.
- The mobile drawer has the same order and the auth buttons.
- Authenticated users still see `Lịch học`, `Tin nhắn`, `Gói học của tôi`.

- [ ] **Step 7: Audit scope and the working tree.**

From the repository root:

```powershell
git diff --stat
git diff -- src/frontend/src/styles/tokens.css src/frontend/tailwind.config.js
git status --short
```

Expected:

- No diff in `tokens.css` or `tailwind.config.js`.
- No backend/API/service contract changes.
- `DESIGN.md` remains deleted in the working tree; do not restore it.
- Only the intended source, test, plan, and spec files are staged/committed. Untracked `.superpowers/` artifacts and mockup screenshots are not committed.

- [ ] **Step 8: Capture final evidence (optional, do not commit).**

Use the browser tool or Playwright to capture:

- `marketplace-desktop-final.png` at 1440px.
- `marketplace-tablet-final.png` at 768px.
- `marketplace-mobile-final.png` at 390px.
- `marketplace-drawer-final.png` with the filter drawer open.

Save them outside the repository (for example `C:\Users\Nguyen Nguyen\AppData\Local\Temp\opencode\`) unless the user explicitly asks to commit screenshots.

- [ ] **Step 9: Commit any final fixes.**

If verification required fixes, commit them with a focused message. If no fixes were needed, do not create an empty commit.

```powershell
git status --short
git add <only-the-files-you-changed>
git commit -m "fix: address marketplace verification findings"
```

---

## Plan Self-Review

- Every task names exact files and shows the code or the exact class strings to replace.
- The only behavior-affecting additions are the optional `footer`/`panelClassName` props, the optional `EmptyState` secondary action, the `totalCount` hero prop, and the trace ID on the timeout error; all are backward compatible.
- The topbar change is intentionally global because `PublicTopbar` is shared; it is isolated in Task 3 and verified on five public routes.
- The marketplace visual tokens remain scoped under `.marketplace-v2`; `tokens.css` and `tailwind.config.js` are explicitly out of scope.
- TDD is used for the pure helpers. UI verification uses the repository's lint/build checks plus a browser matrix because this repo has no React test renderer.
- The plan preserves every existing filter, sort, pagination, URL-search, and API parameter path.
