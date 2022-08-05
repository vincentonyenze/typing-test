import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { recordResult, parseBests, MIN_ACCURACY } from "../js/bests.js";

const result = (wpm, accuracy = 95) => ({ wpm, accuracy, at: 1 });

describe("recordResult", () => {
  test("the first result is a new best", () => {
    const { bests, isNewBest } = recordResult({}, "words-30", result(60));
    assert.equal(isNewBest, true);
    assert.equal(bests["words-30"].wpm, 60);
  });

  test("a faster result replaces the best", () => {
    const { bests, isNewBest } = recordResult({ "words-30": result(60) }, "words-30", result(70));
    assert.equal(isNewBest, true);
    assert.equal(bests["words-30"].wpm, 70);
  });

  test("a slower result doesn't", () => {
    const before = { "words-30": result(60) };
    const { bests, isNewBest } = recordResult(before, "words-30", result(50));
    assert.equal(isNewBest, false);
    assert.equal(bests, before);
  });

  test("an equal result isn't a new best", () => {
    const { isNewBest } = recordResult({ "words-30": result(60) }, "words-30", result(60));
    assert.equal(isNewBest, false);
  });

  test("bests are kept separately for each kind of test", () => {
    const { bests, isNewBest } = recordResult({ "words-30": result(90) }, "words-60", result(50));
    assert.equal(isNewBest, true);
    assert.equal(bests["words-30"].wpm, 90);
  });

  test(`doesn't count below ${MIN_ACCURACY}% accuracy`, () => {
    const { isNewBest } = recordResult({}, "words-30", result(120, MIN_ACCURACY - 1));
    assert.equal(isNewBest, false);
  });

  test("doesn't count 0 WPM", () => {
    assert.equal(recordResult({}, "words-30", result(0)).isNewBest, false);
  });

  test("doesn't change the bests it was given", () => {
    const before = {};
    recordResult(before, "words-30", result(60));
    assert.deepEqual(before, {});
  });
});

describe("parseBests", () => {
  test("reads saved bests", () => {
    const saved = { "words-30": result(60) };
    assert.deepEqual(parseBests(JSON.stringify(saved)), saved);
  });

  test("returns no bests for nothing saved, or broken text", () => {
    assert.deepEqual(parseBests(null), {});
    assert.deepEqual(parseBests("nope"), {});
    assert.deepEqual(parseBests("[1, 2]"), {});
  });

  test("drops damaged entries and keeps the good ones", () => {
    const saved = { "words-30": result(60), "words-15": { wpm: "fast" }, quote: null };
    assert.deepEqual(Object.keys(parseBests(JSON.stringify(saved))), ["words-30"]);
  });
});
