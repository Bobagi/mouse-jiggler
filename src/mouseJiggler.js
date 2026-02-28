#!/usr/bin/env node

const { mouse, Point, straightTo } = require('@nut-tree-fork/nut-js');

const JIGGLE_DISTANCE = Number(process.env.JIGGLE_DISTANCE ?? 5);
const INTERVAL_MS = Number(process.env.JIGGLE_INTERVAL_MS ?? 1000);

if (!Number.isFinite(JIGGLE_DISTANCE) || JIGGLE_DISTANCE <= 0) {
  throw new Error('JIGGLE_DISTANCE must be a positive number.');
}

if (!Number.isFinite(INTERVAL_MS) || INTERVAL_MS <= 0) {
  throw new Error('JIGGLE_INTERVAL_MS must be a positive number in milliseconds.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function jiggleMouse() {
  while (true) {
    const originalPosition = await mouse.getPosition();

    await mouse.move(straightTo(new Point(
      originalPosition.x + JIGGLE_DISTANCE,
      originalPosition.y + JIGGLE_DISTANCE,
    )));

    await sleep(INTERVAL_MS);

    await mouse.move(straightTo(new Point(originalPosition.x, originalPosition.y)));

    await sleep(INTERVAL_MS);
  }
}

jiggleMouse().catch((error) => {
  console.error('Mouse movement failed:', error);
  process.exitCode = 1;
});
