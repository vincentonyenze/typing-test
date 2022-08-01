// A precise test timer.
//
// Two browser tools do the work:
// - performance.now(): milliseconds since the page loaded, with fractions
//   (1234.567). Unlike Date.now() it never jumps when the computer's clock
//   is changed, which matters on a machine whose clock keeps resetting!
// - requestAnimationFrame(fn): "run fn just before the next screen
//   refresh", about 60 times a second. Perfect for updating a display.
//
// The time is always worked out as "now minus start", never by adding up
// frames. Browsers pause frames in hidden tabs, so counting frames would
// make the clock stop; measuring keeps it correct.
//
// `now`, `schedule` and `cancel` can be swapped for fakes, so the tests in
// tests/timer.test.js can control time instead of waiting for it.

export function createTimer({
  limitMs = null, // e.g. 30_000 for a 30 second test, or null to count up
  onTick = () => {}, // called every frame with the elapsed milliseconds
  onEnd = () => {}, // called once when the limit is reached
  now = () => performance.now(),
  schedule = (callback) => requestAnimationFrame(callback),
  cancel = (id) => cancelAnimationFrame(id),
} = {}) {
  let startedAt = null;
  let stoppedAt = null;
  let frameId = null;

  function elapsed() {
    if (startedAt === null) return 0;
    const ms = (stoppedAt ?? now()) - startedAt;
    // Never report more than the limit (e.g. after coming back to a tab
    // that was hidden when the time ran out)
    return limitMs === null ? ms : Math.min(ms, limitMs);
  }

  function isRunning() {
    return startedAt !== null && stoppedAt === null;
  }

  function frame() {
    frameId = null;
    const ms = elapsed();
    onTick(ms);
    if (limitMs !== null && ms >= limitMs) {
      stop();
      onEnd(ms);
      return;
    }
    frameId = schedule(frame);
  }

  function start() {
    if (startedAt !== null) return; // already started
    startedAt = now();
    frameId = schedule(frame);
  }

  // Freeze the time where it is
  function stop() {
    if (!isRunning()) return;
    stoppedAt = now();
    if (frameId !== null) cancel(frameId);
    frameId = null;
  }

  return { start, stop, elapsed, isRunning };
}
