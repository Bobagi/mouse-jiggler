# mouse-jiggler

JavaScript mouse jiggler that periodically moves the cursor to prevent sleep mode or screen lock.

## Compatibility

- Node.js: `>=18` (works with Node 20+)
- Platforms: Windows, macOS, Linux

## Install and run

```bash
npm install
npm start
```

## Optional configuration

- `JIGGLE_DISTANCE` (default: `5`)
  - used as the max random offset range in each axis (`-distance` to `+distance`)
- `JIGGLE_INTERVAL_MS` (default: `1000`)

When started, the app prints `Mouse is jiggling... Press Ctrl+C to stop.` so you can confirm it is running.

Example:

```bash
JIGGLE_DISTANCE=10 JIGGLE_INTERVAL_MS=1500 npm start
```

## Build executables

This project includes `pkg` build scripts for each OS target.

```bash
npm install
npx pkg --version
npm run build:win
npm run build:mac
npm run build:linux
```

Build outputs are generated in `dist/`.

> Note: mouse automation libraries still require OS-level permissions and dependencies on the target machine.
