<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Interface rules

Adapted from [Vercel's Web Interface Guidelines](https://vercel.com/design/guidelines), reduced to what applies here and extended with this project's own invariants. MUST is a blocker: do not open a PR that breaks one. SHOULD is a default you may argue out of in the PR body.

This app is one screen: a board of tier rows, a pool of unranked tiles, and a toolbar. Almost every rule below exists because something in that screen already broke it once.

## Interaction

- MUST: every action available by dragging is also available by clicking. Select a tile, then click a tier chip, a row, or press `1`–`9`. This is WCAG 2.2 SC 2.5.7, and it is also the faster path for ranking many items at once.
- MUST: every control is reachable and operable by keyboard. A `div` with `onClick` is not a control. Use `<button>`, or give the element a role, `tabIndex`, and key handling — never a role alone.
- MUST: never put `role="button"` on an element that contains a `contenteditable` region or another button. Promote the inner element instead.
- MUST: hit targets ≥24px, ≥44px for anything a thumb uses on the board. Icons may stay small; pad the target, don't grow the icon.
- MUST: visible focus. If you remove an outline, replace it with a ring that survives on top of sticky headers and the selection bar.
- MUST: destructive actions confirm or offer Undo. Deleting a tier moves its items back to the pool; it does not drop them.
- SHOULD: keep `touch-action: manipulation` on tiles so tapping to select never waits for a double-tap-zoom.
- SHOULD: state that is worth sharing lives in the URL. The board already serialises to `?s=`; do not add a second source of truth.

## Layout and theme

- MUST: use the tokens in `src/lib/ui-styles.ts` and the CSS variables in `globals.css`. A raw `rgba(0,0,0,…)` shadow is a light-mode bug in waiting — use `var(--theme-backdrop)`.
- MUST: any text drawn on a user-chosen colour computes its own contrast. Tier colours come from a free colour picker; hardcoded black text fails the moment someone picks a dark tier.
- MUST: spacing comes from the `--spacing-*` scale (`inset`, `control`, `group`, `section`). Arbitrary `gap-[13px]` values drift.
- MUST: check the board at phone width, laptop, and 50% zoom. The board is the product; nothing may push the first tier below the fold on a phone.
- SHOULD: one strong colour on screen. Tier chips own it. Buttons, cards, and ads use border and background, not accent bars or tints.
- SHOULD: shadows separate layers (popup, dialog, toast, drag overlay). A button sitting on the page is not a layer.
- NEVER: copy another site's layout maths. `calc((100vw - 66.666vw) / 2 - 12rem)` is correct only for the container it was written for.

## Motion

- MUST: animate `transform` and `opacity` only. Never `top`, `left`, `width`, `height`.
- MUST: list transition properties explicitly; never `transition: all`.
- MUST: honour `prefers-reduced-motion` — the board entry animation and icon crossfades already do.

## Content

- MUST: tiles, tier labels, and empty states survive an empty string, a 60-character name, and a name with no spaces. Truncate or wrap; do not let a tile stretch a row.
- MUST: flex children that truncate need `min-w-0`.
- MUST: every state is designed — empty pool, filtered-to-nothing pool, all-ranked, and the loading skeleton, which must match the real layout so nothing shifts.
- MUST: icon-only buttons carry a real `aria-label`, and status is never colour alone.
- SHOULD: inline hints over tooltips. The keyboard help line under the board is the pattern; a native `title` is a fallback, not documentation.

## Data and rendering

- MUST: anything derived from the current date uses UTC getters. Local getters disagree between a UTC server and a UTC+7 browser for seven hours a day and produce hydration mismatches.
- MUST: controlled inputs have `onChange`; otherwise use `defaultValue`.
- MUST: board state stays serialisable. It round-trips through `localStorage` and the share link.

## Ads

- MUST: a sponsor appears at most once per page. Slots are allocated in one pass in `src/lib/ads.ts`; never let a component filter `ADS` on its own.
- MUST: ads stay inside the reading column, below or beside the board, never above it.
- MUST: sponsored content is labelled and uses `rel="noopener noreferrer sponsored"`.
- NEVER: write copy in a real person's or company's voice. No invented testimonials, no fake activity feeds, no attributing text to a named founder.
- NEVER: embed a third-party page in an iframe without confirming it permits framing.

## Before opening a PR

1. `bun install && bun run lint && bun run build`.
2. Tab through the board with the mouse untouched: select a tile, place it in a tier, rename it, delete a tier, undo.
3. Check both themes. Pick a very dark and a very light tier colour.
4. Check the board at 375px wide.
5. State in the PR body what you did not verify. "Not verified" is an acceptable answer; a silent guess is not.
