// What you type: random common words, or a quote.
// No DOM here, so it's tested in tests/text.test.js.
//
// Every function that picks something at random takes a `random` function
// as an option (default: Math.random). Tests pass in a seeded one, which
// gives the same "random" numbers every run, so the results can be checked.

// 200 of the most common English words: easy to read, so the test
// measures typing rather than spelling
export const WORDS = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for",
  "they", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do",
  "but", "from", "or", "which", "one", "would", "all", "will", "there", "say",
  "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so",
  "what", "time", "up", "go", "about", "than", "into", "could", "state", "only",
  "new", "year", "some", "take", "come", "these", "know", "see", "use", "get",
  "like", "then", "first", "any", "work", "now", "may", "such", "give", "over",
  "think", "most", "even", "find", "day", "also", "after", "way", "many", "must",
  "look", "before", "great", "back", "through", "long", "where", "much", "should",
  "well", "people", "down", "own", "just", "because", "good", "each", "those",
  "feel", "seem", "how", "high", "too", "place", "little", "world", "very",
  "still", "nation", "hand", "old", "life", "tell", "write", "become", "here",
  "show", "house", "both", "between", "need", "mean", "call", "develop", "under",
  "last", "right", "move", "thing", "general", "school", "never", "same",
  "another", "begin", "while", "number", "part", "turn", "real", "leave",
  "might", "want", "point", "form", "off", "child", "few", "small", "since",
  "against", "ask", "late", "home", "interest", "large", "person", "end", "open",
  "public", "follow", "during", "present", "without", "again", "hold", "govern",
  "around", "possible", "head", "consider", "word", "program", "problem",
  "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep",
  "face", "fact", "group", "play", "stand", "increase", "early", "course",
  "change", "help", "line",
];

// Short, well-known quotes (old enough to be free to use)
export const QUOTES = [
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
];

// ===== Randomness =====
// A whole number from 0 up to (but not including) max
function randomIndex(max, random) {
  return Math.floor(random() * max);
}

// A "seeded" random number generator (an algorithm called mulberry32).
// createRandom(42) always produces the same sequence of numbers between
// 0 and 1, just like Math.random but repeatable. Perfect for tests.
export function createRandom(seed) {
  let state = seed >>> 0; // >>> 0 makes it a positive 32-bit whole number
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===== Words mode =====
// `count` random words. The same word never appears twice in a row
// ("the the" looks like a mistake and trips people up).
export function generateWords(count, { random = Math.random, words = WORDS } = {}) {
  const result = [];
  while (result.length < count) {
    const word = words[randomIndex(words.length, random)];
    if (word !== result.at(-1)) result.push(word);
  }
  return result;
}

// ===== Quote mode =====
// A random quote, but not the one you just had (if there's a choice)
export function pickQuote({ random = Math.random, quotes = QUOTES, previous = null } = {}) {
  const choices = quotes.length > 1 ? quotes.filter((quote) => quote !== previous) : quotes;
  return choices[randomIndex(choices.length, random)];
}

// "Well done is better" -> ["Well", "done", "is", "better"]
// Extra spaces and line breaks are ignored.
export function splitWords(text) {
  return text.trim().split(/\s+/);
}
