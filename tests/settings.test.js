import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  parseSettings,
  settingsKey,
  settingsLabel,
  timeLimitMs,
} from "../js/settings.js";

describe("parseSettings", () => {
  test("reads saved settings", () => {
    const text = JSON.stringify({ mode: "quote", durationSeconds: 60 });
    assert.deepEqual(parseSettings(text), { mode: "quote", durationSeconds: 60 });
  });

  test("uses the defaults when nothing is saved", () => {
    assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  });

  test("uses the defaults for text that isn't JSON", () => {
    assert.deepEqual(parseSettings("{oops"), DEFAULT_SETTINGS);
  });

  test("replaces only the settings that aren't valid", () => {
    const text = JSON.stringify({ mode: "quote", durationSeconds: 999 });
    assert.deepEqual(parseSettings(text), { mode: "quote", durationSeconds: 30 });
  });

  test("ignores a mode we don't offer", () => {
    const text = JSON.stringify({ mode: "zen", durationSeconds: 15 });
    assert.deepEqual(parseSettings(text), { mode: "words", durationSeconds: 15 });
  });
});

describe("settingsKey", () => {
  test("is different for each time limit", () => {
    assert.equal(settingsKey({ mode: "words", durationSeconds: 15 }), "words-15");
    assert.equal(settingsKey({ mode: "words", durationSeconds: 60 }), "words-60");
  });

  test("ignores the time limit for quotes", () => {
    assert.equal(settingsKey({ mode: "quote", durationSeconds: 15 }), "quote");
    assert.equal(settingsKey({ mode: "quote", durationSeconds: 60 }), "quote");
  });
});

describe("settingsLabel and timeLimitMs", () => {
  test("words mode has a label with the time and a limit", () => {
    const settings = { mode: "words", durationSeconds: 30 };
    assert.equal(settingsLabel(settings), "words 30s");
    assert.equal(timeLimitMs(settings), 30_000);
  });

  test("quote mode has no time limit", () => {
    const settings = { mode: "quote", durationSeconds: 30 };
    assert.equal(settingsLabel(settings), "quote");
    assert.equal(timeLimitMs(settings), null);
  });
});
