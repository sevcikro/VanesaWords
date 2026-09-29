(() => {
  "use strict";

  const Logic = window.WordLoopLogic;
  const elements = {
    setupView: document.querySelector("#setup-view"),
    gameView: document.querySelector("#game-view"),
    resultView: document.querySelector("#result-view"),
    databaseStatus: document.querySelector("#database-status"),
    languagePill: document.querySelector("#language-pill"),
    directionOptions: [...document.querySelectorAll(".direction-option")],
    packOptions: [...document.querySelectorAll(".pack-option")],
    startButton: document.querySelector("#start-button"),
    quitButton: document.querySelector("#quit-button"),
    roundSizeLabel: document.querySelector("#round-size-label"),
    progressLabel: document.querySelector("#progress-label"),
    queueLabel: document.querySelector("#queue-label"),
    progressBar: document.querySelector("#progress-bar"),
    wordPrompt: document.querySelector("#word-prompt"),
    promptLabel: document.querySelector("#prompt-label"),
    speakButton: document.querySelector("#speak-button"),
    answerForm: document.querySelector("#answer-form"),
    answerInput: document.querySelector("#answer-input"),
    checkButton: document.querySelector("#check-button"),
    feedback: document.querySelector("#feedback"),
    feedbackTitle: document.querySelector("#feedback-title"),
    feedbackText: document.querySelector("#feedback-text"),
    feedbackExplanation: document.querySelector("#feedback-explanation"),
    feedbackExplanationText: document.querySelector("#feedback-explanation-text"),
    continueButton: document.querySelector("#continue-button"),
    attemptsStat: document.querySelector("#attempts-stat"),
    accuracyStat: document.querySelector("#accuracy-stat"),
    streakStat: document.querySelector("#streak-stat"),
    resultWords: document.querySelector("#result-words"),
    resultAccuracy: document.querySelector("#result-accuracy"),
    resultReview: document.querySelector("#result-review"),
    resultMessage: document.querySelector("#result-message"),
    repeatButton: document.querySelector("#repeat-button"),
    changeSizeButton: document.querySelector("#change-size-button"),
  };

  const state = {
    words: [],
    direction: "mixed",
    selectedSize: 20,
    queue: [],
    current: null,
    mastered: 0,
    attempts: 0,
    correctAttempts: 0,
    streak: 0,
    longestStreak: 0,
    missedWordIds: new Set(),
    advanceTimer: null,
    awaitingContinue: false,
  };

  function showView(view) {
    [elements.setupView, elements.gameView, elements.resultView].forEach((item) => {
      item.hidden = item !== view;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setPackSize(size) {
    state.selectedSize = size;
    elements.packOptions.forEach((option) => {
      const selected = Number(option.dataset.size) === size;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-checked", String(selected));
    });
  }

  function setDirection(direction) {
    state.direction = direction;
    elements.directionOptions.forEach((option) => {
      const selected = option.dataset.direction === direction;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-checked", String(selected));
    });

    const labels = {
      "en-sk": "EN → SK",
      "sk-en": "SK → EN",
      mixed: "EN ↔ SK",
    };
    elements.languagePill.textContent = labels[direction];
    elements.languagePill.setAttribute("aria-label", `Smer prekladu: ${labels[direction]}`);
  }

  function resetRoundStats() {
    clearTimeout(state.advanceTimer);
    const pack = Logic.randomPack(state.words, state.selectedSize);
    state.queue = Logic.createDrillQueue(pack, state.direction);
    state.current = null;
    state.mastered = 0;
    state.attempts = 0;
    state.correctAttempts = 0;
    state.streak = 0;
    state.longestStreak = 0;
    state.missedWordIds = new Set();
    state.awaitingContinue = false;
  }

  function startRound() {
    if (state.words.length < state.selectedSize) return;
    resetRoundStats();
    elements.roundSizeLabel.textContent = state.selectedSize;
    showView(elements.gameView);
    nextWord();
  }

  function nextWord() {
    clearTimeout(state.advanceTimer);
    if (!state.queue.length) {
      finishRound();
      return;
    }

    state.current = state.queue.shift();
    state.awaitingContinue = false;
    const direction = state.current.drillDirection;
    const reverse = direction === "sk-en";
    elements.promptLabel.textContent = reverse ? "Prelož do angličtiny" : "Prelož do slovenčiny";
    elements.wordPrompt.textContent = Logic.promptFor(state.current, direction);
    elements.speakButton.hidden = reverse;
    elements.answerInput.value = "";
    elements.answerInput.disabled = false;
    elements.checkButton.disabled = false;
    elements.feedback.hidden = true;
    elements.feedback.className = "feedback";
    elements.continueButton.hidden = true;
    updateStats();
    elements.answerInput.focus();
  }

  function updateStats() {
    const percent = (state.mastered / state.selectedSize) * 100;
    elements.progressLabel.textContent = `${state.mastered} z ${state.selectedSize} zvládnutých`;
    elements.queueLabel.textContent = `${state.selectedSize - state.mastered} zostáva`;
    elements.progressBar.style.width = `${percent}%`;
    elements.attemptsStat.textContent = state.attempts;
    elements.accuracyStat.textContent = state.attempts
      ? `${Logic.accuracy(state.correctAttempts, state.attempts)} %`
      : "—";
    elements.streakStat.textContent = state.streak;
  }

  function showFeedback(kind, title, text, explanation = "") {
    elements.feedback.className = `feedback ${kind}`;
    elements.feedbackTitle.textContent = title;
    elements.feedbackText.textContent = text;
    elements.feedbackExplanationText.textContent = explanation;
    elements.feedbackExplanation.hidden = !explanation;
    elements.feedback.hidden = false;
  }

  function checkAnswer(event) {
    event.preventDefault();
    if (!state.current || state.awaitingContinue) return;

    const answer = elements.answerInput.value;
    if (!Logic.normalizeAnswer(answer)) {
      elements.answerInput.focus();
      return;
    }

    const direction = state.current.drillDirection;
    const correct = Logic.isCorrectAnswer(state.current, answer, direction);
    state.attempts += 1;
    elements.answerInput.disabled = true;
    elements.checkButton.disabled = true;

    if (correct) {
      state.correctAttempts += 1;
      state.mastered += 1;
      state.streak += 1;
      state.longestStreak = Math.max(state.longestStreak, state.streak);
      state.awaitingContinue = true;
      showFeedback(
        "correct",
        "Správne",
        `Správna odpoveď: ${Logic.correctAnswerFor(state.current, direction)}`,
        state.current.explanation_sk
      );
      elements.continueButton.hidden = false;
      updateStats();
      elements.continueButton.focus();
      return;
    }

    state.streak = 0;
    state.missedWordIds.add(state.current.id);
    state.queue = Logic.requeueWrong(state.queue, state.current);
    state.awaitingContinue = true;
    showFeedback(
      "wrong",
      "Ešte nie",
      `Správna odpoveď: ${Logic.correctAnswerFor(state.current, direction)}`,
      state.current.explanation_sk
    );
    elements.continueButton.hidden = false;
    updateStats();
    elements.continueButton.focus();
  }

  function finishRound() {
    const resultAccuracy = Logic.accuracy(state.correctAttempts, state.attempts);
    elements.resultWords.textContent = state.selectedSize;
    elements.resultAccuracy.textContent = `${resultAccuracy} %`;
    elements.resultReview.textContent = state.missedWordIds.size;

    if (state.missedWordIds.size === 0) {
      elements.resultMessage.textContent = `Čisté kolo bez jedinej chyby. Najdlhšia séria: ${state.longestStreak}.`;
    } else {
      elements.resultMessage.textContent = `Všetky slová si napokon zvládol. ${state.missedWordIds.size} z nich sa v kole vrátilo na zopakovanie.`;
    }
    showView(elements.resultView);
  }

  function returnToSetup() {
    clearTimeout(state.advanceTimer);
    state.current = null;
    showView(elements.setupView);
  }

  function speakCurrentWord() {
    if (!state.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(state.current.english);
    utterance.lang = "en-US";
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
  }

  async function loadDatabase() {
    try {
      const response = await fetch("english_slovak_words.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.words) || data.words.length < 100) {
        throw new Error("Neplatný formát databázy");
      }
      state.words = data.words;
      elements.databaseStatus.textContent = `${data.words.length.toLocaleString("sk-SK")} slov pripravených`;
      elements.databaseStatus.classList.add("ready");
      elements.startButton.disabled = false;
    } catch (error) {
      console.error("Database load failed", error);
      elements.databaseStatus.textContent = "Databázu sa nepodarilo načítať";
      elements.databaseStatus.classList.add("error");
    }
  }

  elements.packOptions.forEach((option) => {
    option.addEventListener("click", () => setPackSize(Number(option.dataset.size)));
  });
  elements.directionOptions.forEach((option) => {
    option.addEventListener("click", () => setDirection(option.dataset.direction));
  });
  elements.startButton.addEventListener("click", startRound);
  elements.answerForm.addEventListener("submit", checkAnswer);
  elements.continueButton.addEventListener("click", nextWord);
  elements.quitButton.addEventListener("click", returnToSetup);
  elements.speakButton.addEventListener("click", speakCurrentWord);
  elements.repeatButton.addEventListener("click", startRound);
  elements.changeSizeButton.addEventListener("click", returnToSetup);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && state.awaitingContinue && !elements.gameView.hidden) {
      event.preventDefault();
      nextWord();
    }
  });

  loadDatabase();
})();
