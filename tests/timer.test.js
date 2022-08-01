import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createTimer } from "../js/timer.js";

// A pretend clock and screen. Time only moves when a test says so, and
// frames only run when the test calls runFrame(). No real waiting at all.
function createFakeTime() {
  let time = 1000;
  let waiting = null;
  return {
    now: () => time,
    schedule: (callback) => {
      waiting = callback;
      return 1;
    },
    cancel: () => {
      waiting = null;
    },
    advance(ms) {
      time += ms;
    },
    runFrame() {
      const callback = waiting;
      waiting = null;
      callback?.();
    },
    hasFrameWaiting: () => waiting !== null,
  };
}

function setup(options = {}) {
  const fake = createFakeTime();
  const ticks = [];
  const ends = [];
  const timer = createTimer({
    now: fake.now,
    schedule: fake.schedule,
    cancel: fake.cancel,
    onTick: (ms) => ticks.push(ms),
    onEnd: (ms) => ends.push(ms),
    ...options,
  });
  return { fake, timer, ticks, ends };
}

describe("createTimer", () => {
  test("is at 0 and not running before it starts", () => {
    const { timer } = setup();
    assert.equal(timer.elapsed(), 0);
    assert.equal(timer.isRunning(), false);
  });

  test("measures the time since it started", () => {
    const { fake, timer } = setup();
    timer.start();
    fake.advance(2500);
    assert.equal(timer.elapsed(), 2500);
    assert.equal(timer.isRunning(), true);
  });

  test("reports the time on every frame", () => {
    const { fake, timer, ticks } = setup();
    timer.start();
    fake.advance(16);
    fake.runFrame();
    fake.advance(16);
    fake.runFrame();
    assert.deepEqual(ticks, [16, 32]);
  });

  test("measures real time even if frames are skipped (hidden tab)", () => {
    const { fake, timer, ticks } = setup();
    timer.start();
    fake.advance(5000); // 5 seconds pass without a single frame
    fake.runFrame();
    assert.deepEqual(ticks, [5000]);
  });

  test("ends once at the limit and stops scheduling frames", () => {
    const { fake, timer, ends } = setup({ limitMs: 30_000 });
    timer.start();
    fake.advance(30_000);
    fake.runFrame();
    assert.deepEqual(ends, [30_000]);
    assert.equal(timer.isRunning(), false);
    assert.equal(fake.hasFrameWaiting(), false);
  });

  test("never reports more than the limit", () => {
    const { fake, timer, ends } = setup({ limitMs: 30_000 });
    timer.start();
    fake.advance(45_000); // came back to the tab late
    fake.runFrame();
    assert.deepEqual(ends, [30_000]);
    assert.equal(timer.elapsed(), 30_000);
  });

  test("freezes the time when stopped", () => {
    const { fake, timer } = setup();
    timer.start();
    fake.advance(4000);
    timer.stop();
    fake.advance(9000);
    assert.equal(timer.elapsed(), 4000);
    assert.equal(timer.isRunning(), false);
  });

  test("can't be restarted by calling start() again", () => {
    const { fake, timer } = setup();
    timer.start();
    fake.advance(3000);
    timer.start();
    assert.equal(timer.elapsed(), 3000);
  });

  test("counts up forever without a limit", () => {
    const { fake, timer, ends } = setup();
    timer.start();
    fake.advance(10 * 60_000);
    fake.runFrame();
    assert.equal(ends.length, 0);
    assert.equal(timer.isRunning(), true);
  });
});
