# mouse-jiggler

A small Node.js mouse jiggler that keeps your machine awake and your chat status
**"active"** (e.g. Microsoft Teams green) by giving the cursor a tiny, invisible
nudge every so often.

It is built to be **calm and non-intrusive**:

- **No drift** — every nudge snaps the cursor back to the pixel it started from.
  It will **not** slowly "walk" across the screen like a naive jiggler does.
- **Low frequency** — one nudge every 30 seconds by default, not a constant
  stream of movement, so you can always click anywhere (the terminal included).
- **Stays out of your way** — if you move the mouse yourself, it notices, pauses
  for that cycle, and re-anchors to wherever you left the cursor instead of
  fighting you for it.

> Powered by [`@nut-tree-fork/nut-js`](https://www.npmjs.com/package/@nut-tree-fork/nut-js)
> (the maintained fork of nut.js). Works on Node 18+ — tested on Node 22.

---

## Requirements

- **Node.js 18 or newer** (Node 20 / 22 recommended). Check with `node -v`.
- A C/C++ toolchain is **not** usually needed: nut-js downloads prebuilt native
  binaries during `npm install`.

---

## Quick start

```bash
git clone <this-repo-url>
cd mouse-jiggler
npm install      # installs the native mouse backend for YOUR OS
npm start        # starts jiggling; press Ctrl+C to stop
```

You should see:

```
Mouse is jiggling every 30000ms (+/-4px). Move the mouse to pause it; press Ctrl+C to stop.
```

> ⚠️ `node_modules` is **not** committed — the native binary is OS-specific, so
> each machine must run its own `npm install`. (A Windows build will not run on a
> Mac, and vice-versa.)

---

## Step-by-step: macOS (the main use case)

1. **Install Node** (if you don't have it). Easiest with Homebrew:
   ```bash
   brew install node
   node -v          # should print v18+ (e.g. v22.x)
   ```
2. **Get the project and install deps:**
   ```bash
   cd ~/path/to/mouse-jiggler
   npm install
   ```
3. **Grant Accessibility permission** (required, or the cursor won't move):
   - Open **System Settings → Privacy & Security → Accessibility**.
   - Enable the app you launch the script from — your **Terminal** (or **iTerm**,
     or **Visual Studio Code** if you run it from VS Code's terminal).
   - The first run will usually pop up a request; if you miss it, add it manually
     with the **+** button (`/System/Applications/Utilities/Terminal.app`).
   - After granting it, fully **quit and reopen** the terminal.
4. **Run it:**
   ```bash
   npm start
   ```
   Leave the terminal window open (it can be in the background). Press `Ctrl+C`
   to stop.

> Tip: macOS display sleep can be as low as 1 minute. If the screen still sleeps,
> lower the interval (see Configuration), e.g. `JIGGLE_INTERVAL_MS=15000 npm start`.

---

## Step-by-step: Windows

1. **Install Node** from <https://nodejs.org> (LTS), then check:
   ```powershell
   node -v
   ```
2. **Install deps and run** (PowerShell or CMD):
   ```powershell
   cd C:\path\to\mouse-jiggler
   npm install
   npm start
   ```
   No special permissions are needed on Windows.

> **High-DPI note:** on displays scaled to a non-integer factor (e.g. **125%** or
> **150%**), Windows may round the cursor by **1 pixel** the first time it returns
> to a given spot. This settles immediately and never accumulates — the cursor
> does not walk. (The jiggler accounts for this when detecting whether *you*
> moved the mouse.)

---

## Configuration

All optional, set via environment variables.

| Variable                    | Default | Meaning                                                                                  |
| --------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `JIGGLE_INTERVAL_MS`        | `30000` | Time between nudges, in milliseconds. **Lower it if your display sleeps quickly.**        |
| `JIGGLE_DISTANCE`           | `4`     | Max random offset per axis, in pixels (the cursor returns to origin regardless).         |
| `JIGGLE_RETURN_DELAY_MS`    | `60`    | How long the cursor sits at the nudged spot before snapping back.                         |
| `JIGGLE_USER_MOVE_THRESHOLD`| `20`    | If the cursor moves more than this (px, per axis) between cycles, assume **you** moved it and skip that cycle. |

**macOS / Linux (bash/zsh):**
```bash
JIGGLE_INTERVAL_MS=15000 npm start
```

**Windows PowerShell:**
```powershell
$env:JIGGLE_INTERVAL_MS=15000; npm start
```

**Windows CMD:**
```cmd
set JIGGLE_INTERVAL_MS=15000 && npm start
```

---

## Build standalone executables (optional)

If you'd rather hand someone a single file than ask them to install Node, build
with [`pkg`](https://www.npmjs.com/package/pkg):

```bash
npm install
npm run build:mac     # -> dist/mouse-jiggler-macos
npm run build:win     # -> dist/mouse-jiggler-win.exe
npm run build:linux   # -> dist/mouse-jiggler-linux
```

> The OS permissions above still apply to the built binary (e.g. macOS
> Accessibility must be granted to the executable). The native mouse backend is
> bundled per-target, so build on / for each platform you need.

---

## How it works (in one paragraph)

Every cycle the jiggler reads the cursor position; if it has moved more than the
threshold since the last nudge it assumes you're using the mouse and skips. Otherwise
it moves the cursor a few pixels with an **absolute, instant `setPosition`**,
waits a moment, then `setPosition`s it **straight back to the origin**. Because
there is no interpolated/relative movement, nothing accumulates and the cursor
never wanders. A single posted mouse event is all the OS needs to reset its idle
timer, so a tiny invisible nudge keeps the machine awake and your status active.

---

## Troubleshooting

- **Cursor doesn't move on macOS** → Accessibility permission not granted to the
  terminal you launched from. See the macOS steps above, then quit & reopen it.
- **`Cannot find module '@nut-tree-fork/nut-js'`** → run `npm install` in the
  project folder (deps are not committed).
- **Screen still sleeps / Teams goes away** → lower `JIGGLE_INTERVAL_MS`.
- **`npm install` fails downloading native binaries** → check your network /
  proxy; nut-js fetches a prebuilt binary for your OS during install.
