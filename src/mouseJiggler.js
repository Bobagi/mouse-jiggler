#!/usr/bin/env node

/**
 * Mouse jiggler — keeps the machine awake and your chat status "active" by
 * nudging the cursor a couple of pixels and immediately returning it to where
 * it started.
 *
 * Why this rewrite exists
 * -----------------------
 * The previous version moved with `straightTo()` (interpolated, many events per
 * move) and re-read the live cursor position on every loop. On macOS, pointer
 * acceleration makes each interpolated move land a fraction off-target, and that
 * error accumulated loop after loop — so the cursor "walked" across the screen,
 * fast and erratically, making it almost impossible to grab the mouse.
 *
 * This version follows three rules:
 *   1. No drift   — every move is an absolute, instant `setPosition`, and each
 *                   cycle returns to the pixel it started from. There is no
 *                   interpolation and no accumulating error. (At fractional
 *                   display-scaling factors like 125%, the OS may round the
 *                   round-trip by 1px once; that settles immediately and never
 *                   accumulates.)
 *   2. Calm        — one tiny nudge every INTERVAL (default 30s), not a constant
 *                   stream of moves, so you can always click anywhere (terminal
 *                   included).
 *   3. Don't fight — if you move the mouse yourself between cycles, the jiggler
 *                   notices (movement beyond a tolerance), re-anchors to where
 *                   you left it, and skips that cycle instead of tugging back.
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
const JIGGLE_DISTANCE = readPositiveNumber('JIGGLE_DISTANCE', 4);
// Time between nudges. Calm by default; lower it if your display sleeps fast.
const INTERVAL_MS = readPositiveNumber('JIGGLE_INTERVAL_MS', 30000);
// How long the cursor sits at the nudged spot before snapping back.
const RETURN_DELAY_MS = readPositiveNumber('JIGGLE_RETURN_DELAY_MS', 60);
// Cursor movement (px, per axis) above which we assume *you* moved the mouse and
// skip the cycle. Must stay comfortably above JIGGLE_DISTANCE and any 1px
// display-scaling rounding so our own nudge is never mistaken for user activity.
const USER_MOVE_THRESHOLD = readPositiveNumber('JIGGLE_USER_MOVE_THRESHOLD', 20);

// We drive every step ourselves, so disable nut-js's built-in pauses.
mouse.config.autoDelayMs = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let running = true;
// The pixel the cursor actually rested on after our last nudge. Lets us tell our
// own movement (≈0px) apart from the user grabbing the mouse (> threshold).
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

function movedBeyondThreshold(a, b) {
  return (
    Math.abs(a.x - b.x) > USER_MOVE_THRESHOLD ||
    Math.abs(a.y - b.y) > USER_MOVE_THRESHOLD
  );
}

async function jiggleOnce() {
  const origin = await mouse.getPosition();

  // If the cursor jumped since our last nudge, the user is driving — re-anchor
  // and skip this cycle so we never tug the mouse out from under them.
  if (lastRest && movedBeyondThreshold(origin, lastRest)) {
    lastRest = { x: origin.x, y: origin.y };
    return false;
  }

  const { dx, dy } = randomNudge(JIGGLE_DISTANCE);
  await mouse.setPosition(new Point(origin.x + dx, origin.y + dy));
  await sleep(RETURN_DELAY_MS);
  // Snap back to the starting pixel — this is what prevents drift.
  await mouse.setPosition(new Point(origin.x, origin.y));

  // Record where the cursor *actually* came to rest (display scaling can land it
  // ~1px off from what we requested) so the next activity check is accurate.
  const rest = await mouse.getPosition();
  lastRest = { x: rest.x, y: rest.y };
  return true;
}

async function main() {
  console.log(
    `Mouse is jiggling every ${INTERVAL_MS}ms (+/-${JIGGLE_DISTANCE}px). ` +
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

// Allow this file to be required for testing without starting the loop.
if (require.main === module) {
  main().catch((error) => {
    console.error('Mouse movement failed:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  jiggleOnce,
  randomNudge,
  movedBeyondThreshold,
  config: { JIGGLE_DISTANCE, INTERVAL_MS, RETURN_DELAY_MS, USER_MOVE_THRESHOLD },
};
