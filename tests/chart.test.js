import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { niceMax, niceStep, toPath, chartGeometry } from "../js/chart.js";

const sample = (seconds, wpm, raw = wpm, errors = 0) => ({
  elapsedMs: seconds * 1000,
  wpm,
  raw,
  errors,
});

describe("niceMax", () => {
  test("rounds up to the next multiple of 20", () => {
    assert.equal(niceMax(73), 80);
    assert.equal(niceMax(80), 80);
    assert.equal(niceMax(81), 100);
  });

  test("is at least 20, so a slow test still has a scale", () => {
    assert.equal(niceMax(0), 20);
    assert.equal(niceMax(5), 20);
  });
});

describe("niceStep", () => {
  test("labels every second for very short tests", () => {
    assert.equal(niceStep(8), 1);
  });

  test("keeps the number of labels to about 10", () => {
    assert.equal(niceStep(15), 2);
    assert.equal(niceStep(30), 5);
    assert.equal(niceStep(60), 10);
  });
});

describe("toPath", () => {
  test("moves to the first point and draws lines to the rest", () => {
    assert.equal(
      toPath([{ x: 0, y: 10 }, { x: 5, y: 8 }]),
      "M 0.0,10.0 L 5.0,8.0"
    );
  });

  test("is empty with no points", () => {
    assert.equal(toPath([]), "");
  });
});

describe("chartGeometry", () => {
  const size = { width: 346, height: 234 }; // a 300 × 200 plot inside the padding
  const geometry = chartGeometry([sample(1, 40), sample(2, 60), sample(3, 80)], size);

  test("puts the last second at the right edge of the plot", () => {
    assert.equal(geometry.xTicks.at(-1).x, geometry.plot.left + geometry.plot.width);
  });

  test("puts 0 WPM at the bottom and the top value at the top", () => {
    const bottom = geometry.plot.top + geometry.plot.height;
    assert.equal(geometry.yTicks[0].value, 0);
    assert.equal(geometry.yTicks[0].y, bottom);
    assert.equal(geometry.yTicks.at(-1).value, 80);
    assert.equal(geometry.yTicks.at(-1).y, geometry.plot.top);
  });

  test("draws a higher WPM higher up (a smaller y)", () => {
    const ys = geometry.wpmPath.match(/,(\d+\.\d)/g).map((s) => Number(s.slice(1)));
    assert.ok(ys[0] > ys[1] && ys[1] > ys[2], `y values: ${ys}`);
  });

  test("adds a dot only where there were mistakes", () => {
    const g = chartGeometry([sample(1, 40, 50, 0), sample(2, 50, 60, 2)], size);
    assert.equal(g.errors.length, 1);
    assert.equal(g.errors[0].count, 2);
  });

  test("copes with no samples at all", () => {
    const g = chartGeometry([], size);
    assert.equal(g.wpmPath, "");
    assert.equal(g.errors.length, 0);
  });
});
