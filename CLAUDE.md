# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

A tiny Node.js mouse jiggler. Its real-world job: run on the user's work Mac to
keep the machine from sleeping and keep their Teams status "active". It must be
**unobtrusive** — the user has to be able to keep working (and click the
terminal) while it runs.

## Commands

```bash
npm install        # installs @nut-tree-fork/nut-js (native libnut backend)
npm start          # node src/mouseJiggler.js
npm test           # node --check src/mouseJiggler.js (syntax check only)

# Build standalone executables (output in dist/)
npm run build:mac
npm run build:win
npm run build:linux
```

## Architecture

Single file: `src/mouseJiggler.js`. It loops forever:

1. Read the current cursor position.
2. If the cursor moved since our last nudge, the **user** is active → re-anchor
   and skip this cycle (never fight the user for the mouse).
3. Otherwise nudge a few pixels with an **absolute, instant `setPosition`**,
   wait briefly, then `setPosition` **back to the exact origin pixel**.
4. Sleep `JIGGLE_INTERVAL_MS` and repeat.

Config via env vars: `JIGGLE_INTERVAL_MS` (default 30000),
`JIGGLE_DISTANCE` (default 3), `JIGGLE_RETURN_DELAY_MS` (default 60).
`SIGINT`/`SIGTERM` are handled for a clean shutdown.

## The non-negotiable design rule: no drift

The earlier version used `mouse.move(straightTo(target))` (interpolated movement,
many events per move) and re-anchored to the *live* cursor each loop. On macOS,
pointer acceleration makes each interpolated move land slightly off-target; that
error accumulated every loop, so the cursor "walked" across the screen — fast and
erratic, to the point you couldn't grab the mouse.

**Do not reintroduce `straightTo` or any interpolated/relative movement for the
jiggle.** The cursor must always return to the precise pixel it started from via
absolute `setPosition`. A single posted mouse event is enough to reset the OS
idle timer, so a tiny invisible nudge is all that's needed — bigger or more
frequent movement is never the answer.

## Notes

- Backed by `@nut-tree-fork/nut-js` (the maintained fork; plain `robotjs` is
  broken on Node 20+, which is why the project migrated). If you see a stale
  `robotjs` in `node_modules`, ignore it and run `npm install`.
- macOS needs Accessibility permission granted to the runner (Terminal/iTerm or
  the built binary) or no movement happens.
- Keep it dependency-light and single-file; this is intentionally a small tool.
