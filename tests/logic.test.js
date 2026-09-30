const assert = require("node:assert/strict");
const {
  normalizeAnswer,
  isCorrectAnswer,
  createDrillQueue,
  promptFor,
  correctAnswerFor,
  randomPack,
  accuracy,
  requeueWrong,
} = require("../logic.js");

assert.equal(normalizeAnswer("  Ahoj, SVET!  "), "ahoj svet");
assert.equal(normalizeAnswer("Ne-určitý (člen)"), "neurcity clen");
assert.equal(normalizeAnswer("Ľúbim slovenčinu"), "lubim slovencinu");

const word = {
  slovak: "áno, hej",
  accepted_answers: ["áno", "hej"],
  normalized_answers: ["áno", "hej"],
};
assert.equal(isCorrectAnswer(word, "ÁNO!"), true);
assert.equal(isCorrectAnswer(word, "ano"), true);
assert.equal(isCorrectAnswer(word, "hej"), true);
assert.equal(isCorrectAnswer(word, "nie"), false);

const investment = {
  slovak: "investovanie, investícia",
  accepted_answers: ["investovanie", "investícia"],
  normalized_answers: ["investovanie", "investícia"],
};
assert.equal(isCorrectAnswer(investment, "investicia"), true);
assert.equal(isCorrectAnswer(investment, "investovanie"), true);
assert.equal(isCorrectAnswer(investment, "investor"), false);
assert.equal(isCorrectAnswer({ english: "investment" }, "Investment!", "sk-en"), true);
assert.equal(isCorrectAnswer({ english: "investment" }, "investícia", "sk-en"), false);
assert.equal(
  isCorrectAnswer(
    { english: "says", accepted_english_answers: ["says", "saying", "talking", "talks"] },
    "talks",
    "sk-en"
  ),
  true
);
assert.equal(promptFor({ english: "investment", slovak: "investícia" }, "en-sk"), "investment");
assert.equal(promptFor({ english: "investment", slovak: "investícia" }, "sk-en"), "investícia");
assert.equal(correctAnswerFor({ english: "investment", slovak: "investícia" }, "en-sk"), "investícia");
assert.equal(correctAnswerFor({ english: "investment", slovak: "investícia" }, "sk-en"), "investment");

const mixedQueue = createDrillQueue(
  Array.from({ length: 10 }, (_, id) => ({ id })),
  "mixed",
  () => 0.25
);
assert.equal(mixedQueue.filter((item) => item.drillDirection === "en-sk").length, 5);
assert.equal(mixedQueue.filter((item) => item.drillDirection === "sk-en").length, 5);
assert.equal(createDrillQueue([{ id: 1 }], "sk-en")[0].drillDirection, "sk-en");
assert.throws(() => createDrillQueue([], "sideways"), RangeError);

const words = Array.from({ length: 20 }, (_, id) => ({ id }));
const pack = randomPack(words, 10, () => 0.5);
assert.equal(pack.length, 10);
assert.equal(new Set(pack.map((item) => item.id)).size, 10);
assert.throws(() => randomPack(words, 21), RangeError);

assert.equal(accuracy(8, 10), 80);
assert.equal(accuracy(0, 0), 0);

const retryWord = { id: 99, english: "again" };
const retriedQueue = requeueWrong([{ id: 1 }, { id: 2 }], retryWord);
assert.deepEqual(retriedQueue.map((item) => item.id), [1, 2, 99]);

console.log("logic tests passed");
