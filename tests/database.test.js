const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const databasePath = path.join(__dirname, "..", "english_slovak_words.json");
const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
const audioManifestPath = path.join(__dirname, "..", "audio", "manifest.json");

assert.equal(database.count, 2000);
assert.equal(database.words.length, 2000);
assert.equal(new Set(database.words.map((word) => word.id)).size, database.words.length);
assert.equal(
  new Set(database.words.map((word) => word.english.toLowerCase())).size,
  database.words.length
);
assert.equal(database.words.every((word) => Boolean(word.explanation_sk)), true);
assert.equal(database.words.every((word) => Boolean(word.definition_en)), true);
assert.equal(
  database.words.every(
    (word) =>
      Array.isArray(word.accepted_english_answers) &&
      word.accepted_english_answers.includes(word.english)
  ),
  true
);
assert.equal(database.words.find((word) => word.id === 104).english, "between");
assert.equal(database.words.find((word) => word.id === 240).english, "thing");
assert.equal(database.words.find((word) => word.id === 661).english, "chapter");
assert.equal(database.words.find((word) => word.english === "hello").cefr_level, "A1");
assert.equal(database.words.find((word) => word.english === "comfortable").cefr_level, "A2");
assert.equal(database.words.find((word) => word.english === "airport").cefr_level, "A1");
assert.equal(database.words.find((word) => word.english === "dictionary").slovak, "slovník");
assert.equal(
  database.words.filter((word) => word.source_list === "Oxford 3000").length,
  52
);
assert.equal(database.words.some((word) => word.english === "g"), false);
assert.equal(database.words.some((word) => word.slovak.includes("#HODNOTA!")), false);
assert.equal(
  database.words.some(
    (word) => word.english.length === 1 && !["a", "I"].includes(word.english)
  ),
  false
);
assert.equal(
  database.words.some((word) =>
    /chapater|enviroment|enviromental|occured/i.test(word.english)
  ),
  false
);

const investment = database.words.find((word) => word.english === "investment");
assert.match(investment.explanation_sk, /podstatné meno/i);
assert.match(investment.definition_en, /investing of money/i);

if (fs.existsSync(audioManifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(audioManifestPath, "utf8"));
  const uniqueWords = new Set(database.words.map((word) => word.english.toLowerCase()));
  assert.equal(manifest.records, database.words.length);
  assert.equal(manifest.unique_words, uniqueWords.size);
  assert.equal(manifest.available_files, uniqueWords.size);
  assert.equal(Object.keys(manifest.words).length, uniqueWords.size);
  for (const item of Object.values(manifest.words)) {
    const audioPath = path.join(__dirname, "..", ...item.file.split("/"));
    assert.equal(fs.statSync(audioPath).size >= 1000, true);
  }

  const audioDirectory = path.join(__dirname, "..", "audio", "en-us", "geffen-32");
  const audioFiles = fs.readdirSync(audioDirectory).filter((name) => name.endsWith(".mp3"));
  assert.equal(audioFiles.length, uniqueWords.size);
}

console.log("database tests passed");
