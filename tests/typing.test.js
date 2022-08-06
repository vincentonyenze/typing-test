import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_EXTRA_LETTERS,
  createTyping,
  currentIndex,
  currentText,
  letterStates,
  isComplete,
  setCurrentText,
  nextWord,
  previousWord,
  addWords,
  wordsLeft,
} from "../js/typing.js";

// Type text the way the page does: letter by letter, a space moves on
function typeAll(state, text) {
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

describe("letterStates", () => {
  test("marks every letter as untyped at the start", () => {
    assert.deepEqual(letterStates("fox", ""), ["untyped", "untyped", "untyped"]);
  });

  test("marks right and wrong letters", () => {
    assert.deepEqual(letterStates("quick", "qaic"), [
      "correct", "incorrect", "correct", "correct", "untyped",
    ]);
  });

  test("adds extra letters typed past the end", () => {
    assert.deepEqual(letterStates("fox", "foxes"), [
      "correct", "correct", "correct", "extra", "extra",
    ]);
  });
});

describe("typing letters", () => {
  test("counts correct key presses", () => {
    const state = typeAll(createTyping(["the", "fox"]), "the");
    assert.equal(state.correct, 3);
    assert.equal(state.incorrect, 0);
  });

  test("counts wrong key presses", () => {
    const state = typeAll(createTyping(["the"]), "thx");
    assert.equal(state.correct, 2);
    assert.equal(state.incorrect, 1);
  });

  test("still counts a mistake after it's fixed", () => {
    let state = createTyping(["the"]);
    state = setCurrentText(state, "tx"); // wrong
    state = setCurrentText(state, "t"); // backspace
    state = setCurrentText(state, "th"); // fixed
    assert.equal(state.incorrect, 1);
    assert.equal(state.correct, 2);
  });

  test(`stops ${MAX_EXTRA_LETTERS} letters past the end of a word`, () => {
    const state = setCurrentText(createTyping(["a"]), "a" + "x".repeat(50));
    assert.equal(currentText(state).length, 1 + MAX_EXTRA_LETTERS);
  });
});

describe("moving between words", () => {
  test("space moves to the next word", () => {
    const state = typeAll(createTyping(["the", "fox"]), "the ");
    assert.equal(currentIndex(state), 1);
    assert.equal(currentText(state), "");
  });

  test("space counts as correct after a right word", () => {
    const state = typeAll(createTyping(["the", "fox"]), "the ");
    assert.equal(state.correct, 4);
  });

  test("space counts as wrong after a wrong word", () => {
    const state = typeAll(createTyping(["the", "fox"]), "thx ");
    assert.equal(state.incorrect, 2); // the x, and the space
  });

  test("space does nothing before you've typed anything", () => {
    const state = typeAll(createTyping(["the", "fox"]), " ");
    assert.equal(currentIndex(state), 0);
  });

  test("backspace goes back into a wrong word to fix it", () => {
    const state = previousWord(typeAll(createTyping(["the", "fox"]), "thx "));
    assert.equal(currentIndex(state), 0);
    assert.equal(currentText(state), "thx");
  });

  test("backspace can't go back into a word you got right", () => {
    const state = previousWord(typeAll(createTyping(["the", "fox"]), "the "));
    assert.equal(currentIndex(state), 1);
  });

  test("backspace only goes back from the start of a word", () => {
    const state = previousWord(typeAll(createTyping(["the", "fox"]), "thx f"));
    assert.equal(currentIndex(state), 1);
  });
});

describe("isComplete", () => {
  test("is false part-way through", () => {
    assert.equal(isComplete(typeAll(createTyping(["the", "fox"]), "the fo")), false);
  });

  test("is true once the last word is right, without a space", () => {
    assert.equal(isComplete(typeAll(createTyping(["the", "fox"]), "the fox")), true);
  });

  test("is false if the last word is wrong", () => {
    assert.equal(isComplete(typeAll(createTyping(["the", "fox"]), "the fix")), false);
  });
});

describe("addWords", () => {
  test("adds words to the end", () => {
    const state = addWords(createTyping(["the", "fox"]), ["ran", "far"]);
    assert.deepEqual(state.words, ["the", "fox", "ran", "far"]);
  });

  test("keeps everything you've typed", () => {
    const before = typeAll(createTyping(["the", "fox"]), "the fo");
    const after = addWords(before, ["ran"]);
    assert.deepEqual(after.typed, before.typed);
    assert.equal(after.correct, before.correct);
  });

  test("doesn't change the state it was given", () => {
    const before = createTyping(["the"]);
    addWords(before, ["fox"]);
    assert.deepEqual(before.words, ["the"]);
  });
});

describe("wordsLeft", () => {
  test("counts the words after the current one", () => {
    assert.equal(wordsLeft(typeAll(createTyping(["a", "b", "c", "d"]), "a ")), 2);
  });

  test("is 0 on the last word", () => {
    assert.equal(wordsLeft(typeAll(createTyping(["a", "b"]), "a b")), 0);
  });
});
