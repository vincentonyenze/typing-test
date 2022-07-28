import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  WORDS,
  QUOTES,
  createRandom,
  generateWords,
  pickQuote,
  splitWords,
} from "../js/text.js";

describe("createRandom", () => {
  test("gives the same numbers for the same seed", () => {
    const a = createRandom(42);
    const b = createRandom(42);
    for (let i = 0; i < 5; i++) assert.equal(a(), b());
  });

  test("gives different numbers for different seeds", () => {
    assert.notEqual(createRandom(1)(), createRandom(2)());
  });

  test("only gives numbers from 0 up to 1", () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const n = random();
      assert.ok(n >= 0 && n < 1, `${n} is out of range`);
    }
  });
});

describe("generateWords", () => {
  test("gives exactly the number of words asked for", () => {
    assert.equal(generateWords(50, { random: createRandom(1) }).length, 50);
  });

  test("only uses words from the list", () => {
    for (const word of generateWords(100, { random: createRandom(2) })) {
      assert.ok(WORDS.includes(word), `"${word}" isn't in the list`);
    }
  });

  test("never repeats a word straight away", () => {
    // A tiny list makes repeats very likely, so this really tests the rule
    const words = generateWords(200, { random: createRandom(3), words: ["a", "b"] });
    for (let i = 1; i < words.length; i++) {
      assert.notEqual(words[i], words[i - 1], `"${words[i]}" twice at position ${i}`);
    }
  });

  test("is repeatable with a seed", () => {
    assert.deepEqual(
      generateWords(10, { random: createRandom(99) }),
      generateWords(10, { random: createRandom(99) })
    );
  });
});

describe("pickQuote", () => {
  test("picks one of the quotes", () => {
    assert.ok(QUOTES.includes(pickQuote({ random: createRandom(5) })));
  });

  test("never gives the same quote twice in a row", () => {
    const random = createRandom(6);
    let previous = null;
    for (let i = 0; i < 50; i++) {
      const quote = pickQuote({ random, previous });
      assert.notEqual(quote, previous);
      previous = quote;
    }
  });

  test("still works with only one quote", () => {
    const only = { text: "Hi.", author: "Me" };
    assert.equal(pickQuote({ quotes: [only], previous: only }), only);
  });

  test("every quote has text and an author", () => {
    for (const quote of QUOTES) {
      assert.ok(quote.text.length > 0 && quote.author.length > 0);
    }
  });
});

describe("splitWords", () => {
  test("splits on spaces", () => {
    assert.deepEqual(splitWords("Well done is"), ["Well", "done", "is"]);
  });

  test("ignores extra spaces and line breaks", () => {
    assert.deepEqual(splitWords("  a   b\nc "), ["a", "b", "c"]);
  });
});
