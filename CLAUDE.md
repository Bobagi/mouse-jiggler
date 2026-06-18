# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

A tiny Node.js mouse jiggler. Its real-world job: run on the user's work **Mac**
to keep the machine from sleeping and keep their **Teams** status "active". It
must be **unobtrusive** — the user has to be able to keep working (and click the
terminal) while it runs. It also runs on Windows/Linux.

## Commands

```bash
npm install        # installs @nut-tree-fork/nut-js (native libnut backend) for THIS OS
npm start          # node src/mouseJiggler.js  (Ctrl+C to stop)
npm test           # node --check src/mouseJiggler.js  (syntax check only)

# Build standalone executables (output in dist/)
npm run build:mac    # dist/mouse-jiggler-macos
npm run build:win    # dist/mouse-jiggler-win.exe
npm run build:linux  # dist/mouse-jiggler-linux
```

There is no real test runner. To sanity-check the logic without the infinite
loop, the module exports its internals — require it and exercise them, e.g.:

```bash
# pure logic, does NOT move the mouse:
node -e "const j=require('./src/mouseJiggler.js'); console.log(j.movedBeyondThreshold({x:0,y:0},{x:40,y:0}))"
# real round-trip drift check (moves the mouse a few px, returns):
node -e "const j=require('./src/mouseJiggler.js');const{mouse}=require('@nut-tree-fork/nut-js');(async()=>{const s=await mouse.getPosition();for(let i=0;i<40;i++)await j.jiggleOnce();const e=await mouse.getPosition();console.log('drift',Math.abs(e.x-s.x),Math.abs(e.y-s.y));process.exit(0)})()"
```

## Architecture

Single file: `src/mouseJiggler.js`. It loops forever (`main`), one `jiggleOnce`
per `JIGGLE_INTERVAL_MS`:

1. Read the current cursor position.
2. If it moved more than `JIGGLE_USER_MOVE_THRESHOLD` (px/axis) since our last
   nudge → the **user** is driving. Re-anchor and skip this cycle.
3. Otherwise nudge a few pixels with an **absolute, instant `setPosition`**,
   wait `JIGGLE_RETURN_DELAY_MS`, then `setPosition` **back to the origin pixel**.
4. Re-read the resting position (display scaling can land it ~1px off the
   request) and store it as the new anchor.

`jiggleOnce`, `randomNudge`, `movedBeyondThreshold`, and `config` are exported;
`main()` only runs when the file is the entry point (`require.main === module`).
`SIGINT`/`SIGTERM` are handled for clean shutdown.

Config via env vars: `JIGGLE_INTERVAL_MS` (30000), `JIGGLE_DISTANCE` (4),
`JIGGLE_RETURN_DELAY_MS` (60), `JIGGLE_USER_MOVE_THRESHOLD` (20).

## The non-negotiable design rule: NO DRIFT

The earlier version used `mouse.move(straightTo(target))` (interpolated movement,
many events per move) and re-anchored to the *live* cursor each loop. On macOS,
pointer acceleration makes each interpolated move land slightly off-target; that
error accumulated every loop, so the cursor "walked" across the screen — fast and
erratic, to the point you couldn't grab the mouse.

**Do not reintroduce `straightTo`, `mouse.move`, or any interpolated/relative
movement for the jiggle.** The cursor must always return to the starting pixel
via absolute `setPosition`. A single posted mouse event is enough to reset the OS
idle timer, so a tiny invisible nudge is all that's needed — bigger or more
frequent movement is never the answer.

## Platform notes (verified)

- **macOS** needs Accessibility permission granted to the runner
  (Terminal / iTerm / VS Code / the built binary) or no movement happens.
- **High-DPI / fractional display scaling** (e.g. Windows at 125%): the
  `setPosition`→`getPosition` round-trip is **not** perfectly idempotent — about
  1 in 4 coordinates rounds by 1px. This is a **one-time settle to the nearest
  stable pixel, not cumulative drift** (verified: 0px net drift over 40 cycles
  from a stable pixel). The 1px noise is exactly why activity detection uses a
  tolerance (`JIGGLE_USER_MOVE_THRESHOLD`) instead of exact equality — never
  tighten that back to an exact compare.
- Keep the startup banner ASCII (`+/-`, not `±`) so it doesn't mojibake in
  Windows consoles (cp1252/cp850).

## Repo hygiene

- `node_modules/` and `dist/` are **gitignored** and must stay that way. They
  used to be committed by mistake; the native binaries are OS-specific, so a
  committed Windows build breaks the Mac. `package-lock.json` is the source of
  truth — keep it tracked.
- Keep it dependency-light and single-file; this is intentionally a small tool.
