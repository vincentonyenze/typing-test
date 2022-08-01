// Entry point: the only script loaded by index.html.
// It connects the page (the input, the words) to the typing engine,
// the timer and the stats.
import { generateWords } from "./text.js";
import {
  createTyping,
  currentIndex,
  currentText,
  setCurrentText,
  nextWord,
  previousWord,
  isComplete,
} from "./typing.js";
import { accuracy, calculateStats, correctWordCharacters, wordsPerMinute } from "./stats.js";
import { createTimer } from "./timer.js";
import {
  elements,
  renderWords,
  renderWord,
  moveCaret,
  renderFocus,
  renderLiveStats,
  renderRunning,
} from "./ui.js";

// Enough words for a fast typist; Step 10 adds more as you go
const WORD_COUNT = 60;

// Settings are fixed for now; Step 9 adds the buttons to change them
const settings = { durationSeconds: 30 };

// "ready": waiting for the first key | "running" | "finished"
let status = "ready";
let typing = null;
let timer = null;

// ===== Starting and finishing =====
function newTest() {
  timer?.stop();
  status = "ready";
  typing = createTyping(generateWords(WORD_COUNT));
  timer = createTimer({
    limitMs: settings.durationSeconds * 1000,
    onTick: handleTick,
    onEnd: finish,
  });

  elements.input.value = "";
  elements.input.disabled = false;
  lastShown = { seconds: null, wpm: null };
  renderWords(typing.words);
  moveCaret(0, 0);
  renderRunning(false);
  renderLiveStats({ seconds: settings.durationSeconds, wpm: 0, accuracy: 100 });
  elements.input.focus();
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

  // Step 8 shows these on a results screen
  const stats = calculateStats(typing, timer.elapsed());
  console.table({
    wpm: Math.round(stats.wpm),
    raw: Math.round(stats.raw),
    accuracy: `${stats.accuracy.toFixed(1)}%`,
    ...stats.characters,
    seconds: (stats.elapsedMs / 1000).toFixed(1),
  });
}

// ===== Every frame while running =====
// About 60 times a second. Only the numbers change, and only when they
// actually change: rewriting text that's the same is wasted work.
let lastShown = { seconds: null, wpm: null };

function handleTick(elapsedMs) {
  const secondsLeft = Math.ceil((settings.durationSeconds * 1000 - elapsedMs) / 1000);
  const wpm = Math.round(wordsPerMinute(correctWordCharacters(typing), elapsedMs));

  if (secondsLeft !== lastShown.seconds) renderLiveStats({ seconds: secondsLeft });
  // WPM swings wildly in the first second (2 letters in 0.1s = 240 WPM!)
  if (elapsedMs >= 1000 && wpm !== lastShown.wpm) renderLiveStats({ wpm });
  lastShown = { seconds: secondsLeft, wpm };
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
document.addEventListener("keydown", handlePageKeydown);

newTest();
