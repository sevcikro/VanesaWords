"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const databasePath = path.join(root, "english_slovak_words.json");
const relativeAudioDirectory = "audio/en-us/geffen-32";
const audioDirectory = path.join(root, ...relativeAudioDirectory.split("/"));
const manifestPath = path.join(root, "audio", "manifest.json");
const apiUrl = "https://api.speechify.ai/v1/audio/speech";
const model = "simba-3.2";
const voice = "geffen_32";
const manifestOnly = process.argv.includes("--manifest-only");
const concurrency = Math.max(1, Number.parseInt(process.env.SPEECHIFY_CONCURRENCY || "1", 10));
const requestInterval = Math.max(
  0,
  Number.parseInt(process.env.SPEECHIFY_REQUEST_INTERVAL_MS || "1100", 10)
);
const apiKey = process.env.SPEECHIFY_API_KEY;
let nextRequestAt = 0;

if (!apiKey && !manifestOnly) {
  console.error("Set SPEECHIFY_API_KEY before running this generator.");
  process.exit(1);
}

function keyForWord(word) {
  return word.toLocaleLowerCase("en-US");
}

function fileForWord(word) {
  return `${keyForWord(word)}.mp3`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function reserveRequestSlot() {
  const now = Date.now();
  const delay = Math.max(0, nextRequestAt - now);
  nextRequestAt = Math.max(now, nextRequestAt) + requestInterval;
  if (delay) await wait(delay);
}

async function synthesize(word) {
  await reserveRequestSlot();
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: word,
      voice_id: voice,
      audio_format: "mp3",
      model,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    const error = new Error(`Speechify returned HTTP ${response.status}: ${details}`);
    error.status = response.status;
    throw error;
  }

  const result = await response.json();
  const encodedAudio = String(result.audio_data || "").replace(/^data:audio\/[^;]+;base64,/, "");
  const audio = Buffer.from(encodedAudio, "base64");
  if (audio.length < 1_000) throw new Error(`Speechify returned invalid audio for "${word}"`);

  const destination = path.join(audioDirectory, fileForWord(word));
  const temporary = `${destination}.tmp`;
  await fsp.writeFile(temporary, audio);
  await fsp.rename(temporary, destination);
  return Number(result.billable_characters_count) || word.length;
}

async function synthesizeWithRetry(word) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await synthesize(word);
    } catch (error) {
      const retryable = !error.status || error.status === 429 || error.status >= 500;
      if (!retryable || attempt === 6) throw error;
      await wait(Math.min(30_000, 1_000 * 2 ** (attempt - 1)));
    }
  }
  return 0;
}

async function hasUsableFile(filePath) {
  try {
    return (await fsp.stat(filePath)).size >= 1_000;
  } catch {
    return false;
  }
}

async function main() {
  const database = JSON.parse(await fsp.readFile(databasePath, "utf8"));
  const entries = new Map();

  for (const record of database.words) {
    const key = keyForWord(record.english);
    if (!entries.has(key)) {
      entries.set(key, { word: record.english, recordIds: [] });
    }
    entries.get(key).recordIds.push(record.id);
  }

  await fsp.mkdir(audioDirectory, { recursive: true });
  const allEntries = [...entries.values()];
  const pending = [];

  for (const entry of allEntries) {
    const destination = path.join(audioDirectory, fileForWord(entry.word));
    if (!(await hasUsableFile(destination))) pending.push(entry);
  }

  console.log(`${allEntries.length} unique words; ${pending.length} audio files need generation.`);
  let cursor = 0;
  let completed = 0;
  let billedCharacters = 0;
  const failures = [];
  const startedAt = Date.now();

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= pending.length) return;
      const entry = pending[index];
      try {
        billedCharacters += await synthesizeWithRetry(entry.word);
      } catch (error) {
        failures.push({ word: entry.word, error: error.message });
      }
      completed += 1;
      if (completed % 25 === 0 || completed === pending.length) {
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1_000));
        console.log(`${completed}/${pending.length} processed (${failures.length} failed, ${elapsedSeconds}s)`);
      }
    }
  }

  if (!manifestOnly) {
    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length || 1) }, worker));
  }

  const words = {};
  for (const entry of allEntries) {
    const key = keyForWord(entry.word);
    const file = `${relativeAudioDirectory}/${fileForWord(entry.word)}`;
    if (await hasUsableFile(path.join(root, ...file.split("/")))) {
      words[key] = {
        word: entry.word,
        file,
        record_ids: entry.recordIds,
      };
    }
  }

  const manifest = {
    version: 1,
    provider: "speechify",
    model,
    voice,
    locale: "en-US",
    records: database.words.length,
    unique_words: allEntries.length,
    available_files: Object.keys(words).length,
    billable_characters_this_run: billedCharacters,
    generated_at: new Date().toISOString(),
    words,
  };

  await fsp.mkdir(path.dirname(manifestPath), { recursive: true });
  await fsp.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (failures.length) {
    const failurePath = path.join(root, "audio", "failures.json");
    await fsp.writeFile(failurePath, `${JSON.stringify(failures, null, 2)}\n`, "utf8");
    console.error(`${failures.length} words failed. Re-run the script to retry them.`);
    process.exitCode = 1;
    return;
  }

  const staleFailurePath = path.join(root, "audio", "failures.json");
  if (fs.existsSync(staleFailurePath)) await fsp.unlink(staleFailurePath);
  const mode = manifestOnly ? "Manifest rebuilt" : "Complete";
  console.log(`${mode}: ${Object.keys(words).length} MP3 files and audio/manifest.json.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
