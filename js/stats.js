// Turning a typing state and a time into numbers: WPM and accuracy.
// No DOM, so it's tested in tests/stats.test.js.
//
// The official definitions (used by typing tests and typing courses):
//
// - A "word" is any 5 characters, spaces included. Real words vary in
//   length ("a" vs "development"), so counting them would reward typing
//   short ones. 5 characters is about the average English word plus a space.
//
// - WPM counts only correctly typed words (and the space after each).
//   Typing fast but wrong doesn't help your score.
//
// - Raw WPM counts everything you typed, right or wrong: pure speed.
//
// - Accuracy is correct key presses out of all key presses, including
//   mistakes you later fixed.
import { letterStates, currentIndex, isWordCorrect } from "./typing.js";

export const CHARS_PER_WORD = 5;
const MS_PER_MINUTE = 60_000;

// characters typed in `ms` milliseconds -> words per minute
export function wordsPerMinute(characters, ms) {
  if (ms <= 0) return 0;
  return characters / CHARS_PER_WORD / (ms / MS_PER_MINUTE);
}

// Characters that count for WPM: every correct finished word plus its
// space, and the word in progress if everything so far is right
export function correctWordCharacters(state) {
  const current = currentIndex(state);
  let total = 0;

  state.typed.forEach((typed, index) => {
    if (index < current) {
      if (isWordCorrect(state, index)) total += typed.length + 1; // + the space
    } else if (state.words[index].startsWith(typed)) {
      total += typed.length; // in progress, no mistakes yet
    }
  });
  return total;
}

// Every character typed, plus a space between each pair of words
export function typedCharacters(state) {
  const letters = state.typed.reduce((sum, typed) => sum + typed.length, 0);
  return letters + currentIndex(state);
}

// How the letters ended up, as shown on the results screen:
//   correct   typed right
//   incorrect typed wrong
//   extra     typed past the end of a word
//   missed    skipped: you pressed space before finishing the word
export function characterCounts(state) {
  const counts = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
  const current = currentIndex(state);

  state.typed.forEach((typed, index) => {
    for (const letter of letterStates(state.words[index], typed)) {
      if (letter === "untyped") {
        // Untyped letters in the current word aren't missed, just not reached yet
        if (index < current) counts.missed++;
      } else {
        counts[letter]++;
      }
    }
  });
  return counts;
}

// Correct key presses as a percentage of all key presses (100 before you start)
export function accuracy(state) {
  const presses = state.correct + state.incorrect;
  if (presses === 0) return 100;
  return (state.correct / presses) * 100;
}

// Everything the results screen needs, in one object
export function calculateStats(state, elapsedMs) {
  return {
    wpm: wordsPerMinute(correctWordCharacters(state), elapsedMs),
    raw: wordsPerMinute(typedCharacters(state), elapsedMs),
    accuracy: accuracy(state),
    characters: characterCounts(state),
    elapsedMs,
  };
}
