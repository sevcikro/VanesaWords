const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const databasePath = path.join(__dirname, "..", "english_slovak_words.json");
const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));

assert.equal(database.count, 2000);
assert.equal(database.words.length, 2000);
assert.deepEqual(
  database.words.map((word) => word.id),
  Array.from({ length: 2000 }, (_, index) => index + 1)
);
assert.equal(database.words.every((word) => Boolean(word.explanation_sk)), true);
assert.equal(database.words.every((word) => Boolean(word.definition_en)), true);
assert.equal(database.words.find((word) => word.id === 104).english, "between");

const investment = database.words.find((word) => word.english === "investment");
assert.match(investment.explanation_sk, /podstatné meno/i);
assert.match(investment.definition_en, /investing of money/i);

console.log("database tests passed");
