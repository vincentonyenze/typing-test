// The test settings (mode and time limit), remembered between visits.
// Pure functions for checking them, plus a thin load/save layer.
// Tested in tests/settings.test.js.

const STORAGE_KEY = "typing-test:settings";

export const DURATIONS = [15, 30, 60];
export const MODES = ["words", "quote"];

export const DEFAULT_SETTINGS = { mode: "words", durationSeconds: 30 };

// Saved data can be old, edited by hand, or damaged. Keep each setting
// only if it's one we actually offer; otherwise use the default.
export function parseSettings(text) {
  let saved;
  try {
    saved = JSON.parse(text);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (!saved || typeof saved !== "object") return DEFAULT_SETTINGS;

  return {
    mode: MODES.includes(saved.mode) ? saved.mode : DEFAULT_SETTINGS.mode,
    durationSeconds: DURATIONS.includes(saved.durationSeconds)
      ? saved.durationSeconds
      : DEFAULT_SETTINGS.durationSeconds,
  };
}

// Personal bests are kept per kind of test: 15 seconds of words is a
// different challenge from 60 seconds, or from a quote
export function settingsKey(settings) {
  return settings.mode === "quote" ? "quote" : `words-${settings.durationSeconds}`;
}

// "words 30s" or "quote", for the results screen
export function settingsLabel(settings) {
  return settings.mode === "quote" ? "quote" : `words ${settings.durationSeconds}s`;
}

// A quote runs until you finish it; words stop at the time limit
export function timeLimitMs(settings) {
  return settings.mode === "quote" ? null : settings.durationSeconds * 1000;
}

export function loadSettings() {
  try {
    return parseSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: the settings still work, they just aren't remembered
  }
}
