// Entry point: the only script loaded by index.html.
// It connects the page (the input, the words) to the typing engine,
// the timer and the stats.
import { generateWords, pickQuote, splitWords } from "./text.js";
import {
  createTyping,
  currentIndex,
  currentText,
  setCurrentText,
  nextWord,
  previousWord,
  isComplete,
} from "./typing.js";
import {
  accuracy,
  calculateStats,
  correctWordCharacters,
  wordsPerMinute,
  takeSample,
} from "./stats.js";
import { createTimer } from "./timer.js";
import {
  loadSettings,
  saveSettings,
  settingsKey,
  settingsLabel,
  timeLimitMs,
} from "./settings.js";
import { loadBests, saveBests, recordResult } from "./bests.js";
import {
  elements,
  renderWords,
  renderWord,
  moveCaret,
  renderFocus,
  renderLiveStats,
  renderRunning,
  showResults,
  showTest,
  redrawChart,
  renderSettings,
  renderBest,
} from "./ui.js";

// Enough words for a fast typist; Step 10 adds more as you go
const WORD_COUNT = 60;

let settings = loadSettings();
let bests = loadBests();
// The quote from the last test, so the next one is different
let lastQuote = null;

// "ready": waiting for the first key | "running" | "finished"
let status = "ready";
let typing = null;
let timer = null;
// One snapshot per second, for the chart on the results screen
let samples = [];

// ===== Starting and finishing =====
function newTest() {
  timer?.stop();
  status = "ready";
  samples = [];
  typing = createTyping(chooseWords());
  timer = createTimer({
    limitMs: timeLimitMs(settings),
    onTick: handleTick,
    onEnd: finish,
  });

  elements.input.value = "";
  elements.input.disabled = false;
  lastShown = { seconds: null, wpm: null };
  renderWords(typing.words);
  moveCaret(0, 0);
  renderRunning(false);
  // A countdown starts at the limit; a quote's clock counts up from 0
  renderLiveStats({ seconds: displaySeconds(0), wpm: 0, accuracy: 100 });
  renderSettings(settings);
  renderBest(bests[settingsKey(settings)]);
  showTest();
  elements.input.focus();
}

function chooseWords() {
  if (settings.mode === "words") return generateWords(WORD_COUNT);
  lastQuote = pickQuote({ previous: lastQuote });
  return splitWords(lastQuote.text);
}

// The clock starts on your first key press, not when the page loads, so
// reading the words first doesn't cost you anything
function start() {
  status = "running";
  timer.start();
  renderRunning(true);
}

function finish() {
  if (status === "finished") return;
  status = "finished";
  timer.stop();
  renderRunning(false);
  elements.input.disabled = true; // no more typing into a finished test

  // The last part-second gets a sample too (e.g. 30.0s, or 12.4s for a quote)
  const elapsedMs = timer.elapsed();
  if ((samples.at(-1)?.elapsedMs ?? 0) < elapsedMs) {
    samples.push(takeSample(typing, elapsedMs, samples.at(-1)));
  }

  const stats = calculateStats(typing, elapsedMs);
  const key = settingsKey(settings);
  const recorded = recordResult(bests, key, {
    wpm: stats.wpm,
    accuracy: stats.accuracy,
    at: Date.now(), // the date it happened, so Date.now() is right here
  });
  bests = recorded.bests;
  if (recorded.isNewBest) saveBests(bests);
  renderBest(bests[key]);

  const author = settings.mode === "quote" ? ` – ${lastQuote.author}` : "";
  showResults({
    stats,
    samples,
    modeLabel: settingsLabel(settings) + author,
    isNewBest: recorded.isNewBest,
  });
}

// ===== Settings =====
// One listener for every chip (event delegation). Changing a setting
// saves it and starts a fresh test with it.
function handleSettingsClick(event) {
  const chip = event.target.closest(".chip");
  if (!chip) return;

  const { mode, duration } = chip.dataset;
  settings = {
    ...settings,
    ...(mode && { mode }),
    ...(duration && { durationSeconds: Number(duration) }),
  };
  saveSettings(settings);
  newTest();
}

// ===== Every frame while running =====
// About 60 times a second. Only the numbers change, and only when they
// actually change: rewriting text that's the same is wasted work.
let lastShown = { seconds: null, wpm: null };

// Seconds left for a timed test, seconds so far for a quote
function displaySeconds(elapsedMs) {
  const limitMs = timeLimitMs(settings);
  if (limitMs === null) return Math.floor(elapsedMs / 1000);
  return Math.ceil((limitMs - elapsedMs) / 1000);
}

function handleTick(elapsedMs) {
  const seconds = displaySeconds(elapsedMs);
  const wpm = Math.round(wordsPerMinute(correctWordCharacters(typing), elapsedMs));

  if (seconds !== lastShown.seconds) renderLiveStats({ seconds });
  // WPM swings wildly in the first second (2 letters in 0.1s = 240 WPM!)
  if (elapsedMs >= 1000 && wpm !== lastShown.wpm) renderLiveStats({ wpm });
  lastShown = { seconds, wpm };

  // A new whole second has passed: take a snapshot for the chart. (If
  // frames were paused, e.g. in a hidden tab, skipped seconds are lost,
  // and the chart just draws a straight line across the gap.)
  const second = Math.floor(elapsedMs / 1000);
  const lastSecond = Math.floor((samples.at(-1)?.elapsedMs ?? 0) / 1000);
  if (second > lastSecond) {
    samples.push(takeSample(typing, second * 1000, samples.at(-1)));
  }
}

// ===== Drawing =====
// Redraw the words that may have changed (the current one, plus the one
// you just left or came back from) and move the caret
function update(before) {
  const indexes = new Set([currentIndex(before), currentIndex(typing)]);
  for (const index of indexes) {
    const typed = typing.typed[index] ?? "";
    const isFinished = index < currentIndex(typing);
    renderWord(index, typing.words[index], typed, isFinished);
  }
  moveCaret(currentIndex(typing), currentText(typing).length);
  renderLiveStats({ accuracy: accuracy(typing) });
}

// ===== Typing =====
// The input box always holds just the word in progress. A space means
// "next word". Splitting on every space also handles pasting or a phone
// keyboard sending several words at once.
function handleInput() {
  if (status === "finished") return;
  if (status === "ready") start();

  const before = typing;
  const parts = elements.input.value.split(" ");

  parts.forEach((part, i) => {
    typing = setCurrentText(typing, part);
    if (i < parts.length - 1) typing = nextWord(typing);
  });

  // Keep the box in step with the engine (e.g. a space with nothing typed
  // is dropped, and extra letters past the limit are cut off)
  elements.input.value = currentText(typing);
  update(before);

  if (isComplete(typing)) finish();
}

// Backspace in an empty box doesn't change its value, so there's no
// "input" event. Catch it here to step back into the previous word.
function handleKeydown(event) {
  if (event.key !== "Backspace" || elements.input.value !== "") return;
  const before = typing;
  typing = previousWord(typing);
  if (typing === before) return; // not allowed (that word was right)

  event.preventDefault();
  elements.input.value = currentText(typing);
  update(before);
}

// ===== Focus and shortcuts =====
function focusInput() {
  elements.input.focus();
}

function handlePageKeydown(event) {
  // Esc: start a new test, from anywhere
  if (event.key === "Escape") {
    event.preventDefault();
    newTest();
    return;
  }

  // Typing anywhere on the page goes into the test, even if the input
  // lost focus (e.g. you clicked somewhere else)
  if (document.activeElement === elements.input) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length === 1 && status !== "finished") focusInput();
}

// ===== Init =====
elements.input.addEventListener("input", handleInput);
elements.input.addEventListener("keydown", handleKeydown);
elements.input.addEventListener("focus", () => renderFocus(true));
elements.input.addEventListener("blur", () => renderFocus(status === "finished"));
elements.focusHint.addEventListener("click", focusInput);
document.getElementById("restart-btn").addEventListener("click", newTest);
elements.againBtn.addEventListener("click", newTest);
elements.settings.addEventListener("click", handleSettingsClick);
// The chart is drawn at its size on screen, so redraw it if that changes
window.addEventListener("resize", () => redrawChart(samples));
document.addEventListener("keydown", handlePageKeydown);

newTest();
