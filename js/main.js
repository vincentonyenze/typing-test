// Entry point: the only script loaded by index.html.
import { generateWords } from "./text.js";

// Temporary for Step 4: show some random words as plain text.
// Step 5 replaces this with one <span> per letter.
const words = generateWords(40);
document.getElementById("words").textContent = words.join(" ");
document.getElementById("target-text").textContent = words.join(" ");
