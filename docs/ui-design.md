# UI Design System

Visual references (produced before implementation, used as the build target):

- [Light mode](design/light-mode-reference.png)
- [Dark mode](design/dark-mode-reference.png)

## Principles

Calm and trustworthy over flashy. Financial figures get visual priority; everything else stays quiet. Color is never the only signal for income vs. expense — icons/labels always back it up. Dark mode is a deliberately designed second theme (different surface elevation and saturation), not an inverted light mode.

## Color tokens

Defined as CSS custom properties in `src/index.css`, re-exposed to Tailwind via `@theme inline` so utility classes (`bg-primary-600`, `text-expense-500`, ...) stay theme-aware automatically. Light values sit on `:root`; dark values are redefined under `.dark`, toggled on `<html>` by `ThemeProvider`.

- `primary-*` — deep emerald/teal brand color. Used for the logo, active nav, primary buttons, links, and positive financial indicators.
- `income-*` — aliases `primary-500/600` (income and "good" are the same visual language).
- `expense-*` — restrained coral/red.
- `warning-*` — amber.
- `background` / `surface` / `surface-elevated` / `border` / `border-strong` — layout surfaces, distinct per theme.
- `text-primary` / `text-secondary` / `text-tertiary` — the three-tier text hierarchy.
- `chart-1..6` — the categorical chart palette (see below).

## Categorical chart colors

`src/lib/utils/categoryVisuals.tsx` exports two different color functions — they solve different problems:

- `getChartSeriesColor(index)` — assigns colors by **position** within one chart's dataset. Use this for any chart plotting multiple categories together (pie/donut, grouped bars), so adjacent series can never collide.
- `getCategoryColor(name)` — assigns a color by **hashing the category name**, for a single, isolated badge/icon (a transaction row, a category list row) where consistent per-category identity matters more than global collision-avoidance.

## Typography

Inter, loaded via Google Fonts in `index.html`, set as `--font-sans`. Page titles are `text-2xl font-bold`; card titles `text-sm font-semibold`; financial values `text-2xl font-bold tracking-tight`; secondary text `text-sm text-text-secondary`.

## Motion

Recharts entrance animations (pie/area draw-in) are disabled when `prefers-reduced-motion: reduce` is set — see `usePrefersReducedMotion`. Apply the same hook to any future chart or transition animation.

## Layout shell

`AppShell` (`src/components/layout/AppShell.tsx`): a fixed-width white/dark sidebar on desktop (`Sidebar`, with the active nav item as a filled pill in light mode and a tinted outline in dark mode, per the reference), a sticky top bar (`Topbar`), and a bottom tab bar with a raised center "add" button on mobile (`MobileNav`). A slide-over (`MobileDrawer`) gives mobile/tablet access to the full nav list. `<main>` sets `overflow-y-auto overflow-x-hidden` — the page body must never scroll horizontally; any wide content (tables, etc.) gets its own `overflow-x-auto` wrapper instead.
