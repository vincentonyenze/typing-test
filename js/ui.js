// Everything that draws on the page. These functions read data and
// update the DOM; they never decide anything about the test itself.
import { letterStates } from "./typing.js";
import { drawChart } from "./chart.js";

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
  results: document.getElementById("results"),
  resultsTitle: document.getElementById("results-title"),
  resultWpm: document.getElementById("result-wpm"),
  resultAccuracy: document.getElementById("result-accuracy"),
  resultRaw: document.getElementById("result-raw"),
  resultChars: document.getElementById("result-chars"),
  resultTime: document.getElementById("result-time"),
  resultMode: document.getElementById("result-mode"),
  newBest: document.getElementById("new-best"),
  chart: document.getElementById("chart"),
  chartCaption: document.getElementById("chart-caption"),
  againBtn: document.getElementById("again-btn"),
  settings: document.querySelector(".settings"),
  durationGroup: document.getElementById("duration-group"),
  bestWpm: document.getElementById("best-wpm"),
};

// ===== Settings and best =====
// Highlight the chosen chips. The time limits are hidden for quotes,
// which run until you finish them.
export function renderSettings(settings) {
  for (const chip of elements.settings.querySelectorAll(".chip")) {
    const isOn =
      chip.dataset.mode === settings.mode ||
      Number(chip.dataset.duration) === settings.durationSeconds;
    chip.setAttribute("aria-pressed", String(isOn));
  }
  elements.durationGroup.hidden = settings.mode === "quote";
}

// best: { wpm, ... } for the current settings, or undefined if none yet
export function renderBest(best) {
  elements.bestWpm.textContent = best ? Math.round(best.wpm) : "–";
}

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

// ===== Results =====
// "30s" for a whole number of seconds, "12.4s" otherwise
function formatSeconds(ms) {
  const seconds = ms / 1000;
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
}

// Swap the test for the results
export function showResults({ stats, samples, modeLabel, isNewBest }) {
  const { correct, incorrect, extra, missed } = stats.characters;
  elements.newBest.hidden = !isNewBest;

  elements.resultWpm.textContent = Math.round(stats.wpm);
  elements.resultAccuracy.textContent = `${Math.floor(stats.accuracy)}%`;
  elements.resultRaw.textContent = Math.round(stats.raw);
  elements.resultChars.textContent = `${correct}/${incorrect}/${extra}/${missed}`;
  elements.resultTime.textContent = formatSeconds(stats.elapsedMs);
  elements.resultMode.textContent = modeLabel;
  // A text version of the chart for screen readers
  elements.chartCaption.textContent =
    `Speed during the test: ${Math.round(stats.wpm)} WPM overall, ` +
    `raw speed ranged from ${Math.round(Math.min(...samples.map((s) => s.raw)))} ` +
    `to ${Math.round(Math.max(...samples.map((s) => s.raw)))}.`;

  elements.test.hidden = true;
  elements.results.hidden = false;
  // Draw AFTER the results are visible: a hidden SVG has no size to measure
  drawChart(elements.chart, samples);
  elements.resultsTitle.focus();
}

export function redrawChart(samples) {
  if (!elements.results.hidden) drawChart(elements.chart, samples);
}

export function showTest() {
  elements.results.hidden = true;
  elements.test.hidden = false;
}
