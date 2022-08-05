// Personal bests: your highest WPM for each kind of test, kept in
// localStorage. Pure functions plus a thin load/save layer.
// Tested in tests/bests.test.js.
//
// Saved as an object keyed by settingsKey():
// { "words-30": { wpm: 72.4, accuracy: 96.1, at: 1656900000000 }, "quote": {...} }

const STORAGE_KEY = "typing-test:bests";

// A result has to be at least this accurate to count as a best. A fast
// score at 40% accuracy isn't a record worth keeping.
export const MIN_ACCURACY = 75;

// Add a result. Returns the new bests and whether this was a new record.
export function recordResult(bests, key, { wpm, accuracy, at }) {
  const counts = wpm > 0 && accuracy >= MIN_ACCURACY;
  const previous = bests[key];
  if (!counts || (previous && previous.wpm >= wpm)) {
    return { bests, isNewBest: false };
  }
  return {
    bests: { ...bests, [key]: { wpm, accuracy, at } },
    isNewBest: true,
  };
}

function isValidBest(best) {
  return (
    Boolean(best) &&
    Number.isFinite(best.wpm) &&
    Number.isFinite(best.accuracy) &&
    Number.isFinite(best.at)
  );
}

// Saved text -> bests we can trust. Damaged entries are dropped.
export function parseBests(text) {
  try {
    const saved = JSON.parse(text);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    // Object.entries -> filter -> Object.fromEntries: filter an object
    // the way you'd filter an array
    return Object.fromEntries(
      Object.entries(saved).filter(([, best]) => isValidBest(best))
    );
  } catch {
    return {};
  }
}

export function loadBests() {
  try {
    return parseBests(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

export function saveBests(bests) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bests));
  } catch {
    // Storage blocked or full: the result still shows, it just isn't kept
  }
}
