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

function randomOffset(distance) {
  const min = -distance;
  const max = distance;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTarget(position) {
  let offsetX = 0;
  let offsetY = 0;

  while (offsetX === 0 && offsetY === 0) {
    offsetX = randomOffset(JIGGLE_DISTANCE);
    offsetY = randomOffset(JIGGLE_DISTANCE);
  }

  return new Point(position.x + offsetX, position.y + offsetY);
}

async function jiggleMouse() {
  console.log('Mouse is jiggling... Press Ctrl+C to stop.');

  while (true) {
    const originalPosition = await mouse.getPosition();
    const targetPosition = randomTarget(originalPosition);

    await mouse.move(straightTo(targetPosition));
    await sleep(INTERVAL_MS);

    await mouse.move(straightTo(new Point(originalPosition.x, originalPosition.y)));
    await sleep(INTERVAL_MS);
  }
}

jiggleMouse().catch((error) => {
  console.error('Mouse movement failed:', error);
  process.exitCode = 1;
});
