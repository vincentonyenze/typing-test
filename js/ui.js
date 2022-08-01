// Everything that draws on the page. These functions read data and
// update the DOM; they never decide anything about the test itself.
import { letterStates } from "./typing.js";

export const elements = {
  test: document.getElementById("test"),
  typingArea: document.querySelector(".typing-area"),
  words: document.getElementById("words"),
  targetText: document.getElementById("target-text"),
  caret: document.getElementById("caret"),
  input: document.getElementById("typing-input"),
  focusHint: document.getElementById("focus-hint"),
  liveTime: document.getElementById("live-time"),
  liveWpm: document.getElementById("live-wpm"),
  liveAccuracy: document.getElementById("live-accuracy"),
};

// ===== Words =====
// One letter: <span class="letter letter--correct">q</span>
function createLetter(char, state) {
  const span = document.createElement("span");
  span.className = `letter letter--${state}`;
  span.textContent = char;
  return span;
}

// Fill a word's element with its letters, coloured by what was typed.
// Extra letters show what you actually typed, so you can see the mistake.
function fillWord(element, target, typed) {
  const states = letterStates(target, typed);
  element.replaceChildren(
    ...states.map((state, i) => createLetter(state === "extra" ? typed[i] : target[i], state))
  );
}

// Draw every word once, at the start of a test
export function renderWords(words) {
  const elementsForWords = words.map((word) => {
    const element = document.createElement("div");
    element.className = "word";
    fillWord(element, word, "");
    return element;
  });
  elements.words.replaceChildren(...elementsForWords);
  elements.targetText.textContent = words.join(" ");
}

// Redraw ONE word. Typing a letter only ever changes the current word, so
// there's no need to rebuild the other few hundred letters on screen.
// isFinished: a word you've moved past gets a red underline if it's wrong
export function renderWord(index, target, typed, isFinished) {
  const element = elements.words.children[index];
  fillWord(element, target, typed);
  element.classList.toggle("word--error", isFinished && typed !== target);
}

// ===== Caret =====
// Put the caret in front of letter `letterIndex` of word `wordIndex`, or
// just after the last letter if you've typed to the end of the word.
export function moveCaret(wordIndex, letterIndex) {
  const word = elements.words.children[wordIndex];
  if (!word) return;

  const letters = word.children;
  const atEnd = letterIndex >= letters.length;
  const letter = letters[Math.min(letterIndex, letters.length - 1)];

  // offsetLeft/offsetTop are measured from .typing-area (the nearest
  // positioned parent), the same box the caret is placed in
  const x = letter.offsetLeft + (atEnd ? letter.offsetWidth : 0);
  const y = letter.offsetTop + (letter.offsetHeight - elements.caret.offsetHeight) / 2;

  // transform instead of left/top: the browser can move it without
  // re-working out the layout of the page, so it stays smooth
  elements.caret.style.transform = `translate(${x}px, ${y}px)`;
}

// ===== Live stats =====
// Whole numbers only: a WPM of 72.3816 is just noise while you type.
// Only the values passed in are updated.
export function renderLiveStats({ seconds, wpm, accuracy }) {
  if (seconds !== undefined) elements.liveTime.textContent = seconds;
  if (wpm !== undefined) elements.liveWpm.textContent = Math.round(wpm);
  // floor, not round: 99.6% shouldn't show as 100% when you made a mistake
  if (accuracy !== undefined) elements.liveAccuracy.textContent = Math.floor(accuracy);
}

// Brighter stats and a solid caret while the test is running
export function renderRunning(isRunning) {
  elements.test.classList.toggle("test--running", isRunning);
}

// ===== Focus =====
export function renderFocus(hasFocus) {
  elements.typingArea.classList.toggle("typing-area--blurred", !hasFocus);
  elements.focusHint.hidden = hasFocus;
}
