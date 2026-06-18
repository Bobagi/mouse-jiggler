# mouse-jiggler

A small JavaScript mouse jiggler that keeps your machine awake and your chat
status "active" (e.g. Teams green) by giving the cursor a tiny, invisible nudge
every so often.

It is built to be **calm and non-intrusive**:

- **No drift** — every nudge snaps the cursor back to the exact pixel it started
  from. It will not slowly "walk" across the screen.
- **Low frequency** — one nudge every 30 seconds by default, not a constant
  stream of movement, so you can always click anywhere (including the terminal).
- **Stays out of your way** — if you move the mouse yourself, it notices, pauses
  for that cycle, and re-anchors to wherever you left the cursor instead of
  fighting you.

## Compatibility

- Node.js: `>=18` (works with Node 20+)
- Platforms: macOS, Windows, Linux

> On **macOS** you must grant Accessibility permission to whatever runs the
> script (Terminal / iTerm / the built executable) under
> *System Settings → Privacy & Security → Accessibility*, otherwise the cursor
> won't move.

## Install and run

```bash
npm install
npm start
```

When started it prints a confirmation line so you know it's running. Press
`Ctrl+C` to stop.

## Configuration

All optional, set via environment variables:

| Variable                 | Default | Meaning                                                           |
| ------------------------ | ------- | ----------------------------------------------------------------- |
| `JIGGLE_INTERVAL_MS`     | `30000` | Time between nudges, in ms. Lower it if your display sleeps fast.  |
| `JIGGLE_DISTANCE`        | `3`     | Max random offset per axis, in pixels (cursor returns anyway).    |
| `JIGGLE_RETURN_DELAY_MS` | `60`    | How long the cursor sits at the nudged spot before snapping back. |

Example — nudge every 15 seconds:

```bash
JIGGLE_INTERVAL_MS=15000 npm start
```

## Build executables

This project includes `pkg` build scripts for each OS target.

```bash
npm install
npm run build:mac     # dist/mouse-jiggler-macos
npm run build:win     # dist/mouse-jiggler-win.exe
npm run build:linux   # dist/mouse-jiggler-linux
```

Build outputs are written to `dist/`.

> Note: native mouse automation still requires the OS-level permissions and
> dependencies above on the target machine.
