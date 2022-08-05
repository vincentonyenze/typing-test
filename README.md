# Typing Speed Test

A typing test in the style of Monkeytype: type the words as they appear, watch each letter turn green or red, and get your **WPM, accuracy and a speed chart** at the end. Built with plain HTML, CSS and JavaScript (no frameworks or libraries) and covered by **92 automated tests**.

This is **Project 10** in my beginner-to-expert web development roadmap (Level 2).

<!-- Add a screenshot: save one as screenshot.png in this folder and uncomment the line below -->
<!-- ![Typing test screenshot](screenshot.png) -->

## Features

- **Words mode** (15, 30 or 60 seconds) and **quote mode** (runs until you finish the quote)
- Letters coloured as you type: correct, wrong, and **extra** letters past the end of a word
- A smooth gliding caret, and red underlines on finished words with mistakes
- Backspace into a **wrong** word to fix it (correct words are locked)
- The clock starts on your **first key press**, not when the page loads
- Live countdown, WPM and accuracy
- Results: WPM, accuracy, raw WPM, characters (correct / incorrect / extra / missed), time
- A **speed chart drawn in SVG** by hand: overall WPM, raw speed each second, and red dots for mistakes
- **Personal best** for each kind of test, saved in the browser (needs 75%+ accuracy)
- Settings remembered between visits
- Text scrolls line by line; timed tests never run out of words
- Works with phone keyboards, accented letters and other input methods
- Paste is blocked, so scores stay honest
- Keyboard friendly: start typing anywhere, `Esc` to restart
- Screen-reader friendly: plain-text version of the words, a text summary of the chart
- Dark theme, or light if your system uses light mode

## How the numbers are worked out

These follow the standard used by typing tests:

| Stat | How it's calculated |
|---|---|
| **WPM** | Characters in **correctly typed** words (plus their spaces) ÷ 5 ÷ minutes |
| **Raw** | **Every** character typed, right or wrong ÷ 5 ÷ minutes |
| **Accuracy** | Correct key presses ÷ all key presses, **including mistakes you fixed** |

A "word" is any 5 characters, so long and short words count fairly. Deleting a mistake fixes the text, but not your accuracy.

## Built with

- HTML5 (`<dl>` for stats, `<figure>` + `<figcaption>` for the chart, `<kbd>`, `aria-*` attributes)
- CSS3 (custom properties, `will-change`, `@keyframes`, `prefers-color-scheme`, `prefers-reduced-motion`)
- Vanilla JavaScript (ES6+) in ES modules
- SVG for the chart, created with `createElementNS`
- `performance.now()` and `requestAnimationFrame` for timing
- `localStorage` for settings and personal bests
- **Node's built-in test runner** (`node --test`)

## How it works

```
key press → <input> → typing.js (what was typed, what's right) → ui.js (letters, caret)
                                     │
            timer.js (every frame) → stats.js (WPM, accuracy, samples) → chart.js
```

- **An invisible `<input>`** sits over the words and receives the typing. Phones only show a keyboard for real inputs, and it handles accents and autocorrect for free.
- **`typing.js`** holds the test as plain data (`words`, `typed`, `correct`, `incorrect`) and returns a new state for every change.
- **`ui.js`** redraws **only the word that changed**, not all the letters on screen.
- **`timer.js`** always works out time as "now minus start", so it stays correct even when the browser pauses frames in a hidden tab.
- **`chart.js`** does the chart maths (scales, paths, ticks) in pure functions, then builds the SVG.

All the logic modules contain **no DOM code**, which is why they can be tested in Node. Randomness and time are **passed in** (a seeded random generator, a fake clock), so tests are repeatable and never wait.

## What I learned

- **Reading an input instead of keys,** so it works with every keyboard, including phones
- **Comparing text letter by letter,** and counting mistakes honestly
- **The official WPM and accuracy formulas,** and documenting the rules
- **Precise timing:** `performance.now()` vs `Date.now()`, `requestAnimationFrame`, measuring instead of counting frames
- **State machines:** `ready → running → finished`
- **Dependency injection** for testing: seeded randomness and a fake clock
- **Drawing charts by hand:** scales, SVG paths, the flipped y axis, `createElementNS`
- **Performance:** updating only what changed, animating with `transform`, `will-change`
- **Scrolling with `overflow: hidden`,** and why positions ignore scroll
- **Composition events** for accented and non-Latin characters
- **Validating saved data** field by field

## How to run

1. Clone the repository:
   ```bash
   git clone https://github.com/vincentonyenze/typing-test.git
   cd typing-test
   ```
2. Open the folder in VS Code and start **Live Server** (right-click `index.html` → *Open with Live Server*).

A local server is needed because browsers block ES modules on pages opened straight from a file (`file://`).

| Key | Action |
|---|---|
| Any letter | Start (or continue) typing |
| `Space` | Next word |
| `Backspace` | Delete; at the start of a word, go back to fix a wrong one |
| `Esc` | New test |

## Running the tests

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm test             # run all tests once
npm run test:watch   # re-run them every time a file is saved
```

| File | Tests | Covers |
|---|---|---|
| `tests/typing.test.js` | 22 | letter states, counting key presses, moving between words, adding words |
| `tests/stats.test.js` | 17 | WPM, raw, accuracy, character counts, per-second samples |
| `tests/text.test.js` | 13 | seeded randomness, word generation, quotes |
| `tests/bests.test.js` | 11 | personal best rules, damaged saved data |
| `tests/chart.test.js` | 11 | axis scales, round-number ticks, SVG paths |
| `tests/settings.test.js` | 9 | validating saved settings, keys and labels |
| `tests/timer.test.js` | 9 | elapsed time, limits, hidden tabs, stopping |

## Project structure

```
typing-test/
├── index.html          # Settings, live stats, typing area, results
├── style.css           # Theme, letter states, caret, results, chart
├── package.json        # npm scripts for the tests
├── js/
│   ├── main.js         # Connects everything: state, events, start/finish
│   ├── typing.js       # The typing engine: what's typed and what's right
│   ├── stats.js        # WPM, accuracy, character counts, chart samples
│   ├── timer.js        # Precise timer with an optional limit
│   ├── text.js         # Word list, quotes, seeded random generator
│   ├── chart.js        # Chart maths and SVG drawing
│   ├── settings.js     # Mode and time limit, saved and validated
│   ├── bests.js        # Personal bests, saved and validated
│   └── ui.js           # Drawing letters, caret, stats and results
├── tests/              # Automated tests (node --test)
└── README.md
```

## Known limitations

- The timer keeps running if you switch to another tab mid-test.
- Seconds skipped while a tab is hidden don't get their own point on the chart.
- Settings and bests are stored in this browser only.
- English words only.

## Possible improvements

- More languages and word lists (e.g. the 1,000 most common words)
- Punctuation and numbers options
- A history of past results with a progress chart
- Highlight the keys you get wrong most often
