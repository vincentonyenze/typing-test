// Entry point: the only script loaded by index.html.
// It connects the page (the input, the words) to the typing engine.
import { generateWords } from "./text.js";
import {
  createTyping,
  currentIndex,
  currentText,
  setCurrentText,
  nextWord,
  previousWord,
} from "./typing.js";
import { elements, renderWords, renderWord, moveCaret, renderFocus } from "./ui.js";

// Enough words for a fast typist; Step 10 adds more as you go
const WORD_COUNT = 60;

let typing = createTyping(generateWords(WORD_COUNT));

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
}

// ===== Typing =====
// The input box always holds just the word in progress. A space means
// "next word". Splitting on every space also handles pasting or a phone
// keyboard sending several words at once.
function handleInput() {
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

// ===== Focus =====
function focusInput() {
  elements.input.focus();
}

// Typing anywhere on the page goes into the test, even if the input
// lost focus (e.g. you clicked somewhere else)
function handlePageKeydown(event) {
  if (document.activeElement === elements.input) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length === 1) focusInput(); // a letter, not Tab or Shift
}

// ===== Init =====
elements.input.addEventListener("input", handleInput);
elements.input.addEventListener("keydown", handleKeydown);
elements.input.addEventListener("focus", () => renderFocus(true));
elements.input.addEventListener("blur", () => renderFocus(false));
elements.focusHint.addEventListener("click", focusInput);
document.addEventListener("keydown", handlePageKeydown);

renderWords(typing.words);
moveCaret(0, 0);
focusInput();
