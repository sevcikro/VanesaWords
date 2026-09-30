(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WordLoopLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalizeAnswer(value) {
    return String(value ?? "")
      .normalize("NFKD")
      .toLocaleLowerCase("sk")
      .replace(/\p{M}/gu, "")
      .replace(/[\p{P}\p{S}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function acceptedAnswers(word, direction = "en-sk") {
    if (direction === "sk-en") {
      const englishCandidates = Array.isArray(word.accepted_english_answers)
        ? word.accepted_english_answers
        : [word.english];
      return [...new Set(englishCandidates.map(normalizeAnswer).filter(Boolean))];
    }

    const candidates = [
      ...(Array.isArray(word.normalized_answers) ? word.normalized_answers : []),
      ...(Array.isArray(word.accepted_answers) ? word.accepted_answers : []),
      word.slovak,
    ];
    return [...new Set(candidates.map(normalizeAnswer).filter(Boolean))];
  }

  function isCorrectAnswer(word, answer, direction = "en-sk") {
    const normalized = normalizeAnswer(answer);
    return Boolean(normalized) && acceptedAnswers(word, direction).includes(normalized);
  }

  function createDrillQueue(words, direction = "mixed", random = Math.random) {
    if (!Array.isArray(words)) throw new TypeError("words must be an array");
    if (!["en-sk", "sk-en", "mixed"].includes(direction)) {
      throw new RangeError("unknown drill direction");
    }

    const mixedOffset = random() < 0.5 ? 0 : 1;
    return words.map((word, index) => ({
      ...word,
      drillDirection:
        direction === "mixed"
          ? (index + mixedOffset) % 2 === 0
            ? "en-sk"
            : "sk-en"
          : direction,
    }));
  }

  function promptFor(word, direction = "en-sk") {
    return direction === "sk-en" ? word.slovak : word.english;
  }

  function correctAnswerFor(word, direction = "en-sk") {
    return direction === "sk-en" ? word.english : word.slovak;
  }

  function randomPack(words, size, random = Math.random) {
    if (!Array.isArray(words)) throw new TypeError("words must be an array");
    if (!Number.isInteger(size) || size < 1 || size > words.length) {
      throw new RangeError("size must fit inside the word list");
    }

    const copy = words.slice();
    for (let i = copy.length - 1; i > copy.length - 1 - size; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(copy.length - size);
  }

  function accuracy(correct, attempts) {
    return attempts ? Math.round((correct / attempts) * 100) : 0;
  }

  function requeueWrong(queue, word) {
    if (!Array.isArray(queue)) throw new TypeError("queue must be an array");
    return [...queue, word];
  }

  return {
    normalizeAnswer,
    acceptedAnswers,
    isCorrectAnswer,
    createDrillQueue,
    promptFor,
    correctAnswerFor,
    randomPack,
    accuracy,
    requeueWrong,
  };
});
