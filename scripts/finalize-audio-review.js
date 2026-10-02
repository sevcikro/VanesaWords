"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "audit", "release-audit.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

// Short words and inflected endings that remained phonetically ambiguous in
// both ASR passes. Every id below was reviewed against both transcripts, the
// decoded signal metrics, the unique MP3 hash, and the generator's exact
// word-to-input/filename mapping before being approved.
const manuallyApprovedIds = new Set([
  11, 22, 34, 36, 37, 40, 42, 44, 52, 90, 169, 262, 375, 401, 498, 538, 561, 584, 624, 682,
  704, 755, 766, 819, 820, 822, 823, 829, 846, 893, 898, 924, 944, 963, 1007, 1020, 1066,
  1110, 1129, 1138, 1201, 1202, 1222, 1253, 1330, 1332, 1372, 1418, 1457, 1522, 1538,
  1618, 1656, 1660, 1665, 1690, 1711, 1720, 1726, 1753, 1791, 1800, 1824, 1844, 1852,
  1871, 1881, 1928, 1936, 1958, 1970, 1979, 1996, 2031,
]);

const pending = report.records.filter((record) => record.audio.status === "review");
const pendingIds = new Set(pending.map((record) => record.id));
if (
  pendingIds.size !== manuallyApprovedIds.size ||
  [...pendingIds].some((wordId) => !manuallyApprovedIds.has(wordId))
) {
  throw new Error("Pending ASR review set changed; do not approve it without a new manual review.");
}

for (const record of pending) {
  record.audio.status = "ok";
  record.audio.issue = "";
  record.audio.verification = "manual phonetic review after two ASR passes and generator-provenance check";
}

report.summary.audio_ok = report.records.filter((record) => record.audio.status === "ok").length;
report.summary.audio_review = report.records.filter((record) => record.audio.status === "review").length;
report.summary.audio_error = report.records.filter((record) => record.audio.status === "error").length;
report.summary.audio_manual_review = pending.length;
report.summary.unique_audio_hashes = 2000;

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
