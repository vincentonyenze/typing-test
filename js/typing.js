// The typing "engine": what you were meant to type, what you've typed, and
// how they compare. No DOM, so it's tested in tests/typing.test.js.
//
// The state looks like this, a few words into a test:
// {
//   words: ["the", "quick", "brown", "fox"],   what to type
//   typed: ["the", "qu"],                      what you typed, word by word
//                                              (the last one is in progress)
//   correct: 6,                                every correct key press
//   incorrect: 0,                              every wrong one, even if fixed later
// }
//
// Each function returns a NEW state instead of changing the old one, like
// the stores in the Notes and Movie apps.

// You can type up to this many letters past the end of a word. Any more and
// the word would push everything else off the screen.
export const MAX_EXTRA_LETTERS = 10;

export function createTyping(words) {
  return { words, typed: [""], correct: 0, incorrect: 0 };
}

// ===== Reading =====
export function currentIndex(state) {
  return state.typed.length - 1;
}

export function currentText(state) {
  return state.typed.at(-1);
}

// Did you type word i exactly right? (Only meaningful for finished words)
export function isWordCorrect(state, index) {
  return state.typed[index] === state.words[index];
}

// How each letter of a word should look:
//   letterStates("quick", "qaic") ->
//   ["correct", "incorrect", "correct", "correct", "untyped"]
//   letterStates("fox", "foxes") ->
//   ["correct", "correct", "correct", "extra", "extra"]
export function letterStates(target, typed) {
  const states = [...target].map((letter, i) => {
    if (i >= typed.length) return "untyped";
    return typed[i] === letter ? "correct" : "incorrect";
  });
  const extras = Array.from({ length: Math.max(0, typed.length - target.length) }, () => "extra");
  return [...states, ...extras];
}

// The test is done when every word is typed and the last one is right.
// (No space needed after the last word, just like the end of a sentence.)
export function isComplete(state) {
  return (
    state.typed.length === state.words.length &&
    isWordCorrect(state, state.words.length - 1)
  );
}

// ===== Changing =====
// How many letters two strings share at the start: ("quick", "quack") -> 2
function sharedStart(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

// The word in progress is now `text` (whatever the input box contains).
// Every letter that's NEW since last time counts as a key press, right or
// wrong. Deleting doesn't undo a mistake you made: that's what makes
// accuracy honest.
export function setCurrentText(state, text) {
  const index = currentIndex(state);
  const target = state.words[index];
  const limited = text.slice(0, target.length + MAX_EXTRA_LETTERS);
  const before = state.typed[index];

  let { correct, incorrect } = state;
  const newFrom = sharedStart(before, limited);
  for (let i = newFrom; i < limited.length; i++) {
    if (limited[i] === target[i]) correct++;
    else incorrect++;
  }

  return {
    ...state,
    typed: [...state.typed.slice(0, -1), limited],
    correct,
    incorrect,
  };
}

// Space: finish this word and start the next. The space itself counts as
// a key press: correct if the word was right.
export function nextWord(state) {
  const index = currentIndex(state);
  // Nothing typed yet, or no words left: a space does nothing
  if (currentText(state) === "" || index === state.words.length - 1) return state;

  const right = isWordCorrect(state, index);
  return {
    ...state,
    typed: [...state.typed, ""],
    correct: state.correct + (right ? 1 : 0),
    incorrect: state.incorrect + (right ? 0 : 1),
  };
}

// Put more words on the end. A timed test never runs out of words: they're
// topped up as you get near the end. Nothing you've typed changes.
export function addWords(state, moreWords) {
  return { ...state, words: [...state.words, ...moreWords] };
}

// How many words are left after the one you're on
export function wordsLeft(state) {
  return state.words.length - 1 - currentIndex(state);
}

// Backspace at the start of a word: go back into the previous word, but
// only to fix it. A word you got right is locked, so you can't keep
// backspacing through the whole text.
export function previousWord(state) {
  const index = currentIndex(state);
  if (index === 0 || currentText(state) !== "") return state;
  if (isWordCorrect(state, index - 1)) return state;
  return { ...state, typed: state.typed.slice(0, -1) };
}
