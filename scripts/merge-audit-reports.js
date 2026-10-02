"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const auditDirectory = path.join(root, "audit");
const partPaths = [1, 2, 3, 4].map((part) => path.join(auditDirectory, `release-audit-part-${part}.json`));
const reports = partPaths.map((partPath) => JSON.parse(fs.readFileSync(partPath, "utf8")));
const records = reports.flatMap((report) => report.records).sort((a, b) => a.id - b.id);

if (records.length !== 2000 || new Set(records.map((record) => record.id)).size !== 2000) {
  throw new Error(`Expected 2,000 unique audited records, received ${records.length}.`);
}

const count = (status) => records.filter((record) => record.audio.status === status).length;
const structuralErrors = reports.flatMap((report) => report.structural_errors);
const orphanMp3s = [...new Set(reports.flatMap((report) => report.orphan_mp3s))].sort();
const spellingProblemRecords = records.filter(
  (record) => record.translation_spelling_errors.length || record.explanation_spelling_errors.length
).length;
const merged = {
  summary: {
    audited_at: new Date().toISOString(),
    database_records: records.length,
    semantic_records_reviewed: records.length,
    unique_ids: new Set(records.map((record) => record.id)).size,
    unique_english_headwords: new Set(records.map((record) => record.english.toLowerCase())).size,
    structural_error_records: structuralErrors.length,
    spelling_problem_records: spellingProblemRecords,
    audio_ok: count("ok"),
    audio_review: count("review"),
    audio_error: count("error"),
    orphan_mp3_files: orphanMp3s.length,
  },
  method: reports[0].method,
  structural_errors: structuralErrors,
  orphan_mp3s: orphanMp3s,
  records,
};

fs.writeFileSync(path.join(auditDirectory, "release-audit.json"), `${JSON.stringify(merged, null, 2)}\n`);
console.log(JSON.stringify(merged.summary, null, 2));
