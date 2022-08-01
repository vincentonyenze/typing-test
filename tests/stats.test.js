import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createTyping, setCurrentText, nextWord, currentText } from "../js/typing.js";
import {
  wordsPerMinute,
  correctWordCharacters,
  typedCharacters,
  characterCounts,
  accuracy,
  calculateStats,
  takeSample,
} from "../js/stats.js";

const MINUTE = 60_000;

// Type text letter by letter, a space moves on (as on the page)
function typeAll(words, text) {
  let state = createTyping(words);
  let current = "";
  for (const char of text) {
    if (char === " ") {
      state = nextWord(state);
      current = currentText(state);
    } else {
      current += char;
      state = setCurrentText(state, current);
    }
  }
  return state;
}

describe("wordsPerMinute", () => {
  test("5 characters in a minute is 1 WPM", () => {
    assert.equal(wordsPerMinute(5, MINUTE), 1);
  });

  test("250 characters in a minute is 50 WPM", () => {
    assert.equal(wordsPerMinute(250, MINUTE), 50);
  });

  test("the same characters in half the time is double the speed", () => {
    assert.equal(wordsPerMinute(250, MINUTE / 2), 100);
  });

  test("is 0 before any time has passed (no dividing by zero)", () => {
    assert.equal(wordsPerMinute(10, 0), 0);
  });
});

describe("correctWordCharacters", () => {
  test("counts correct words and their spaces", () => {
    // "the " (4) + "fox " (4) + "ran" in progress (3)
    const state = typeAll(["the", "fox", "ran"], "the fox ran");
    assert.equal(correctWordCharacters(state), 11);
  });

  test("leaves out a wrong word completely", () => {
    // "thx " counts nothing, "fox" in progress counts 3
    const state = typeAll(["the", "fox"], "thx fox");
    assert.equal(correctWordCharacters(state), 3);
  });

  test("leaves out the word in progress once it has a mistake", () => {
    const state = typeAll(["the", "fox"], "the fx");
    assert.equal(correctWordCharacters(state), 4);
  });
});

describe("typedCharacters", () => {
  test("counts every letter and space, right or wrong", () => {
    // "thx" + space + "fo"
    assert.equal(typedCharacters(typeAll(["the", "fox"], "thx fo")), 6);
  });
});

describe("characterCounts", () => {
  test("sorts letters into correct, incorrect, extra and missed", () => {
    // the: 3 correct | fxo for fox: f correct, x o incorrect |
    // ranxx for ran: 3 correct + 2 extra | "o" for over: 1 correct, 3 missed
    // | "th" for the: in progress, not missed
    const state = typeAll(["the", "fox", "ran", "over", "the"], "the fxo ranxx o th");
    assert.deepEqual(characterCounts(state), {
      correct: 3 + 1 + 3 + 1 + 2,
      incorrect: 2,
      extra: 2,
      missed: 3,
    });
  });
});

describe("accuracy", () => {
  test("is 100 before you start", () => {
    assert.equal(accuracy(createTyping(["the"])), 100);
  });

  test("is 100 with no mistakes", () => {
    assert.equal(accuracy(typeAll(["the", "fox"], "the fox")), 100);
  });

  test("counts mistakes you fixed", () => {
    let state = createTyping(["ab"]);
    state = setCurrentText(state, "x"); // wrong
    state = setCurrentText(state, ""); // deleted
    state = setCurrentText(state, "a");
    state = setCurrentText(state, "ab");
    // 2 right, 1 wrong
    assert.equal(accuracy(state), (2 / 3) * 100);
  });
});

describe("calculateStats", () => {
  test("puts it all together", () => {
    // 10 correct words of "word": 10 × 5 characters (with spaces) = 50,
    // minus the space after the last one = 49, typed in 12 seconds
    const words = Array(10).fill("word");
    const state = typeAll(words, words.join(" "));
    const stats = calculateStats(state, 12_000);

    assert.equal(Math.round(stats.wpm), 49);
    assert.equal(Math.round(stats.raw), 49);
    assert.equal(stats.accuracy, 100);
    assert.equal(stats.elapsedMs, 12_000);
  });

  test("raw is higher than WPM when there are mistakes", () => {
    const stats = calculateStats(typeAll(["the", "fox"], "thx fox"), MINUTE);
    assert.ok(stats.raw > stats.wpm);
  });
});

describe("takeSample", () => {
  test("measures the first second from the start", () => {
    // 10 correct presses ("the fox ra") in 1 second
    const sample = takeSample(typeAll(["the", "fox", "ran"], "the fox ra"), 1000);
    assert.equal(sample.raw, wordsPerMinute(10, 1000)); // 120
    assert.equal(sample.errors, 0);
  });

  test("measures only what happened since the last sample", () => {
    const first = takeSample(typeAll(["the", "fox"], "the"), 1000);
    // 2 more presses in the next second, one of them wrong
    const second = takeSample(typeAll(["the", "fox"], "the x"), 2000, first);
    assert.equal(second.raw, wordsPerMinute(2, 1000));
    assert.equal(second.errors, 1);
  });

  test("works out the overall WPM so far", () => {
    const state = typeAll(["the", "fox"], "the fox");
    assert.equal(takeSample(state, 2000).wpm, wordsPerMinute(7, 2000));
  });
});
