#!/usr/bin/env node

/**
 * Mouse jiggler — keeps the machine awake and your chat status "active" by
 * nudging the cursor a couple of pixels and immediately returning it to the
 * exact pixel it started from.
 *
 * Why this rewrite exists
 * -----------------------
 * The previous version moved with `straightTo()` (interpolated, many events per
 * move) and re-read the live cursor position on every loop. On macOS, pointer
 * acceleration makes each interpolated move land a fraction off-target, and that
 * error accumulated loop after loop — so the cursor "walked" across the screen,
 * fast and erratically, making it almost impossible to grab the mouse.
 *
 * This version fixes that with three rules:
 *   1. No drift   — every move is an absolute, instant `setPosition`, and each
 *                   cycle returns to the precise pixel it started from. There is
 *                   no interpolation and no accumulating error.
 *   2. Calm        — one tiny nudge every INTERVAL (default 30s), not a constant
 *                   stream of moves, so you can always click anywhere (terminal
 *                   included).
 *   3. Don't fight — if you move the mouse yourself between cycles, the jiggler
 *                   notices, re-anchors to where you left it, and skips that
 *                   cycle instead of yanking the cursor back.
 *
 * A single posted mouse event is enough to reset the OS idle timer (which keeps
 * the Mac awake and Teams green), so a tiny invisible nudge does the job.
 */

const { mouse, Point } = require('@nut-tree-fork/nut-js');

function readPositiveNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number, got: ${raw}`);
  }
  return value;
}

// Max random offset per axis, in pixels. Tiny on purpose — the cursor returns
// to its origin anyway, so the only thing that matters is that an event fires.
const JIGGLE_DISTANCE = readPositiveNumber('JIGGLE_DISTANCE', 3);
// Time between nudges. Calm by default; lower it if your display sleeps fast.
const INTERVAL_MS = readPositiveNumber('JIGGLE_INTERVAL_MS', 30000);
// How long the cursor sits at the nudged spot before snapping back.
const RETURN_DELAY_MS = readPositiveNumber('JIGGLE_RETURN_DELAY_MS', 60);

// We drive every step ourselves, so disable nut-js's built-in pauses.
mouse.config.autoDelayMs = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let running = true;
// The pixel the cursor was resting on after our last nudge. Lets us tell our
// own movement apart from the user's.
let lastRest = null;

function randomNudge(distance) {
  const pick = () => Math.round((Math.random() * 2 - 1) * distance);
  let dx = 0;
  let dy = 0;
  while (dx === 0 && dy === 0) {
    dx = pick();
    dy = pick();
  }
  return { dx, dy };
}

async function jiggleOnce() {
  const origin = await mouse.getPosition();

  // If the cursor isn't where we left it, the user moved it — they're active.
  // Re-anchor and skip this cycle so we never tug the mouse out from under them.
  if (lastRest && (origin.x !== lastRest.x || origin.y !== lastRest.y)) {
    lastRest = { x: origin.x, y: origin.y };
    return;
  }

  const { dx, dy } = randomNudge(JIGGLE_DISTANCE);
  await mouse.setPosition(new Point(origin.x + dx, origin.y + dy));
  await sleep(RETURN_DELAY_MS);
  // Snap back to the exact starting pixel — this is what prevents drift.
  await mouse.setPosition(new Point(origin.x, origin.y));

  lastRest = { x: origin.x, y: origin.y };
}

async function main() {
  console.log(
    `Mouse is jiggling every ${INTERVAL_MS}ms (±${JIGGLE_DISTANCE}px). ` +
      'Move the mouse to pause it; press Ctrl+C to stop.'
  );

  while (running) {
    await jiggleOnce();
    await sleep(INTERVAL_MS);
  }
}

function stop(signal) {
  if (!running) return;
  running = false;
  console.log(`\nReceived ${signal}. Stopping mouse jiggler.`);
  process.exit(0);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

main().catch((error) => {
  console.error('Mouse movement failed:', error);
  process.exitCode = 1;
});
