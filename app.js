/**
 * Multiplication Practice App
 * Pure vanilla JavaScript - zero external dependencies
 */

(function () {
  'use strict';

  // --- Sound Synthesizer via Web Audio API ---
  class SoundManager {
    constructor() {
      this.enabled = localStorage.getItem('sound_enabled') !== 'false';
      this.audioCtx = null;
    }

    initContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('sound_enabled', this.enabled);
      return this.enabled;
    }

    playTone(freq, type, duration, startTime = 0) {
      if (!this.enabled) return;
      this.initContext();
      if (!this.audioCtx) return;

      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + startTime);

        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + startTime);
        osc.stop(this.audioCtx.currentTime + startTime + duration);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    }

    playCorrect() {
      // Pleasant two-tone ascending chime (C5 -> G5)
      this.playTone(523.25, 'sine', 0.12, 0);
      this.playTone(783.99, 'sine', 0.22, 0.09);
    }

    playWrong() {
      // Low gentle thud
      this.playTone(180, 'triangle', 0.25, 0);
    }

    playWin() {
      // Triumphant mini-fanfare (C5, E5, G5, C6)
      this.playTone(523.25, 'triangle', 0.15, 0);
      this.playTone(659.25, 'triangle', 0.15, 0.12);
      this.playTone(783.99, 'triangle', 0.15, 0.24);
      this.playTone(1046.50, 'triangle', 0.35, 0.36);
    }

    playClick() {
      this.playTone(400, 'sine', 0.05, 0);
    }
  }

  const sound = new SoundManager();

  // --- Theme Management ---
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeDarkIcon = document.getElementById('theme-icon-dark');
  const themeLightIcon = document.getElementById('theme-icon-light');

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      themeDarkIcon.classList.add('hidden');
      themeLightIcon.classList.remove('hidden');
    } else {
      themeDarkIcon.classList.remove('hidden');
      themeLightIcon.classList.add('hidden');
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // Sound Toggle Icon
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');

  function updateSoundUI() {
    if (sound.enabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
    }
  }

  soundToggleBtn.addEventListener('click', () => {
    sound.toggle();
    updateSoundUI();
  });

  // --- Tab Navigation ---
  const tabs = {
    quiz: { btn: document.getElementById('tab-quiz'), view: document.getElementById('quiz-view') },
    flashcards: { btn: document.getElementById('tab-flashcards'), view: document.getElementById('flashcards-view') },
    grid: { btn: document.getElementById('tab-grid'), view: document.getElementById('grid-view') }
  };

  function switchTab(targetKey) {
    Object.keys(tabs).forEach(key => {
      const isTarget = key === targetKey;
      tabs[key].btn.classList.toggle('active', isTarget);
      tabs[key].btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tabs[key].view.classList.toggle('hidden', !isTarget);
    });

    if (targetKey === 'grid') {
      renderGrid();
    } else if (targetKey === 'flashcards') {
      initFlashcards();
    }
  }

  tabs.quiz.btn.addEventListener('click', () => switchTab('quiz'));
  tabs.flashcards.btn.addEventListener('click', () => switchTab('flashcards'));
  tabs.grid.btn.addEventListener('click', () => switchTab('grid'));
  document.getElementById('brand-home-btn').addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('quiz');
  });

  // --- 1. Quiz Mode State & Logic ---
  const quizSetupPanel = document.getElementById('quiz-setup-panel');
  const quizActivePanel = document.getElementById('quiz-active-panel');
  const quizResultsPanel = document.getElementById('quiz-results-panel');

  const tablesGrid = document.getElementById('tables-chip-grid');
  const lengthGrid = document.getElementById('length-chip-grid');
  const timerGrid = document.getElementById('timer-chip-grid');

  const startQuizBtn = document.getElementById('start-quiz-btn');
  const exitQuizBtn = document.getElementById('exit-quiz-btn');
  const retryQuizBtn = document.getElementById('retry-quiz-btn');
  const practiceMissedBtn = document.getElementById('practice-missed-btn');
  const changeSettingsBtn = document.getElementById('change-settings-btn');

  const equationDisplay = document.getElementById('equation-display');
  const equationBox = document.getElementById('quiz-equation-box');
  const feedbackHint = document.getElementById('feedback-hint');
  const answerForm = document.getElementById('answer-form');
  const answerInput = document.getElementById('answer-input');
  const quizProgressBar = document.getElementById('quiz-progress-bar');
  const quizProgressText = document.getElementById('quiz-progress-text');
  const quizScoreBadge = document.getElementById('quiz-score-badge');
  const quizStreakBadge = document.getElementById('quiz-streak-badge');
  const quizTimerBadge = document.getElementById('quiz-timer-badge');

  // Quiz state
  let selectedTables = ['all'];
  let selectedLength = 20;
  let selectedTimerMode = 'none';

  let currentQuestions = [];
  let currentIndex = 0;
  let currentScore = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let missedQuestions = [];
  let timerInterval = null;
  let timerSeconds = 0;
  let questionCountdown = 10;
  let acceptingAnswer = true;

  // Setup panel chip selection
  tablesGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    const val = btn.dataset.value;

    if (val === 'all') {
      tablesGrid.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTables = ['all'];
    } else {
      const allBtn = tablesGrid.querySelector('[data-value="all"]');
      allBtn.classList.remove('selected');
      btn.classList.toggle('selected');

      const activeChips = Array.from(tablesGrid.querySelectorAll('.chip-btn.selected')).map(b => b.dataset.value);
      if (activeChips.length === 0) {
        allBtn.classList.add('selected');
        selectedTables = ['all'];
      } else {
        selectedTables = activeChips;
      }
    }
  });

  lengthGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    lengthGrid.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedLength = btn.dataset.value === 'endless' ? 'endless' : parseInt(btn.dataset.value, 10);
  });

  timerGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    timerGrid.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTimerMode = btn.dataset.value;
  });

  function generateQuestionSet(tables, count) {
    const pool = [];
    const tableNums = tables.includes('all') 
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] 
      : tables.map(Number);

    tableNums.forEach(a => {
      for (let b = 1; b <= 12; b++) {
        pool.push({ a, b, answer: a * b });
      }
    });

    // Shuffle pool (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    if (count === 'endless') {
      return pool;
    }

    // If count > pool size, repeat shuffled pools
    const result = [];
    while (result.length < count) {
      for (const item of pool) {
        if (result.length >= count) break;
        result.push(item);
      }
    }
    return result;
  }

  function startQuiz(customQuestions = null) {
    currentIndex = 0;
    currentScore = 0;
    currentStreak = 0;
    maxStreak = 0;
    missedQuestions = [];
    acceptingAnswer = true;

    if (customQuestions && customQuestions.length > 0) {
      currentQuestions = [...customQuestions];
    } else {
      currentQuestions = generateQuestionSet(selectedTables, selectedLength);
    }

    quizSetupPanel.classList.add('hidden');
    quizResultsPanel.classList.add('hidden');
    quizActivePanel.classList.remove('hidden');

    startTimer();
    renderQuestion();
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerSeconds = 0;

    if (selectedTimerMode === 'none') {
      quizTimerBadge.classList.add('hidden');
      return;
    }

    quizTimerBadge.classList.remove('hidden');

    if (selectedTimerMode === 'stopwatch') {
      quizTimerBadge.textContent = '⏱️ 00:00';
      timerInterval = setInterval(() => {
        timerSeconds++;
        quizTimerBadge.textContent = `⏱️ ${formatTime(timerSeconds)}`;
      }, 1000);
    } else if (selectedTimerMode === 'countdown') {
      questionCountdown = 10;
      quizTimerBadge.textContent = `⏳ ${questionCountdown}s`;
      timerInterval = setInterval(() => {
        timerSeconds++;
        questionCountdown--;
        quizTimerBadge.textContent = `⏳ ${questionCountdown}s`;
        if (questionCountdown <= 0) {
          handleTimeout();
        }
      }, 1000);
    }
  }

  function handleTimeout() {
    if (!acceptingAnswer) return;
    submitCurrentAnswer(-1, true);
  }

  function renderQuestion() {
    if (currentIndex >= currentQuestions.length) {
      if (selectedLength === 'endless') {
        // Generate more questions
        currentQuestions.push(...generateQuestionSet(selectedTables, 12));
      } else {
        finishQuiz();
        return;
      }
    }

    const q = currentQuestions[currentIndex];
    equationDisplay.textContent = `${q.a} × ${q.b} = ?`;
    equationBox.className = 'equation-box';
    feedbackHint.textContent = 'Type your answer and press Enter';
    feedbackHint.className = 'hint-text';

    answerInput.value = '';
    answerInput.disabled = false;
    answerInput.focus();
    acceptingAnswer = true;

    // Reset countdown if countdown timer mode
    if (selectedTimerMode === 'countdown') {
      questionCountdown = 10;
      quizTimerBadge.textContent = `⏳ ${questionCountdown}s`;
    }

    // Update Header Badges
    const totalDisplay = selectedLength === 'endless' ? '∞' : currentQuestions.length;
    quizProgressText.textContent = `${currentIndex + 1} / ${totalDisplay}`;
    quizScoreBadge.textContent = `Score: ${currentScore}`;
    quizStreakBadge.textContent = `🔥 Streak: ${currentStreak}`;

    const progressPct = selectedLength === 'endless' 
      ? 100 
      : ((currentIndex) / currentQuestions.length) * 100;
    quizProgressBar.style.width = `${progressPct}%`;
  }

  function submitCurrentAnswer(valOverride = null, isTimeout = false) {
    if (!acceptingAnswer) return;

    const q = currentQuestions[currentIndex];
    const val = valOverride !== null ? valOverride : parseInt(answerInput.value.trim(), 10);

    if (isNaN(val) && !isTimeout) {
      answerInput.focus();
      return;
    }

    acceptingAnswer = false;
    answerInput.disabled = true;

    const isCorrect = val === q.answer;

    if (isCorrect) {
      currentScore++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;

      equationBox.classList.add('feedback-correct');
      feedbackHint.textContent = 'Great job! Correct!';
      feedbackHint.className = 'hint-text correct-hint';
      sound.playCorrect();

      setTimeout(() => {
        currentIndex++;
        renderQuestion();
      }, 650);
    } else {
      currentStreak = 0;
      missedQuestions.push({
        a: q.a,
        b: q.b,
        answer: q.answer,
        userValue: isTimeout ? 'Time out' : val
      });

      equationBox.classList.add('feedback-wrong');
      feedbackHint.textContent = `${q.a} × ${q.b} = ${q.answer}`;
      feedbackHint.className = 'hint-text wrong-hint';
      sound.playWrong();

      setTimeout(() => {
        currentIndex++;
        renderQuestion();
      }, 1400);
    }

    quizScoreBadge.textContent = `Score: ${currentScore}`;
    quizStreakBadge.textContent = `🔥 Streak: ${currentStreak}`;
  }

  answerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitCurrentAnswer();
  });

  // On-screen numeric keypad support
  const keypad = document.getElementById('numeric-keypad');
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.keypad-btn');
    if (!btn || !acceptingAnswer) return;

    const key = btn.dataset.key;
    if (key === 'clear') {
      answerInput.value = '';
    } else if (key === 'backspace') {
      answerInput.value = answerInput.value.slice(0, -1);
    } else {
      if (answerInput.value.length < 5) {
        answerInput.value += key;
      }
    }
    answerInput.focus();
    sound.playClick();
  });

  function finishQuiz() {
    clearInterval(timerInterval);

    quizActivePanel.classList.add('hidden');
    quizResultsPanel.classList.remove('hidden');

    const total = currentIndex;
    const accuracy = total > 0 ? Math.round((currentScore / total) * 100) : 0;

    document.getElementById('results-percentage').textContent = `${accuracy}%`;
    document.getElementById('results-correct-count').textContent = `${currentScore} / ${total}`;
    document.getElementById('results-max-streak').textContent = maxStreak;
    document.getElementById('results-total-time').textContent = formatTime(timerSeconds);

    const emojiEl = document.getElementById('results-emoji');
    const summaryText = document.getElementById('results-summary-text');

    if (accuracy >= 90) {
      emojiEl.textContent = '🌟';
      summaryText.textContent = 'Outstanding work! You have sharp multiplication skills.';
      sound.playWin();
    } else if (accuracy >= 70) {
      emojiEl.textContent = '👍';
      summaryText.textContent = 'Good effort! A little more practice and you will master these.';
    } else {
      emojiEl.textContent = '💪';
      summaryText.textContent = 'Keep practicing! Repetition is the mother of learning.';
    }

    // Missed questions review
    const missedWrap = document.getElementById('missed-questions-wrap');
    const missedList = document.getElementById('missed-items-list');
    missedList.innerHTML = '';

    if (missedQuestions.length > 0) {
      missedWrap.classList.remove('hidden');
      practiceMissedBtn.classList.remove('hidden');

      missedQuestions.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.a} × ${item.b} = ${item.answer} (You: ${item.userValue})`;
        missedList.appendChild(li);
      });
    } else {
      missedWrap.classList.add('hidden');
      practiceMissedBtn.classList.add('hidden');
    }
  }

  startQuizBtn.addEventListener('click', () => startQuiz());
  exitQuizBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to end this session early?')) {
      finishQuiz();
    }
  });

  retryQuizBtn.addEventListener('click', () => startQuiz());

  practiceMissedBtn.addEventListener('click', () => {
    if (missedQuestions.length > 0) {
      const missedToPractice = missedQuestions.map(m => ({ a: m.a, b: m.b, answer: m.answer }));
      startQuiz(missedToPractice);
    }
  });

  changeSettingsBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    quizResultsPanel.classList.add('hidden');
    quizActivePanel.classList.add('hidden');
    quizSetupPanel.classList.remove('hidden');
  });

  // --- 2. Flashcards Mode Logic ---
  const flashcardBox = document.getElementById('flashcard-box');
  const flashcardInner = document.getElementById('flashcard-inner');
  const flashcardFrontText = document.getElementById('flashcard-front-text');
  const flashcardBackText = document.getElementById('flashcard-back-text');
  const cardCountBadge = document.getElementById('card-count-badge');
  const flashcardFilterGrid = document.getElementById('flashcard-filter-grid');

  const fcPrevBtn = document.getElementById('fc-prev-btn');
  const fcNextBtn = document.getElementById('fc-next-btn');
  const fcFlipBtn = document.getElementById('fc-flip-btn');
  const fcShuffleBtn = document.getElementById('fc-shuffle-btn');

  let flashcardDeck = [];
  let fcIndex = 0;
  let fcFilterTable = 'all';

  function buildFlashcardDeck(filter) {
    const deck = [];
    const tables = filter === 'all' 
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] 
      : [parseInt(filter, 10)];

    tables.forEach(a => {
      for (let b = 1; b <= 12; b++) {
        deck.push({ a, b, answer: a * b });
      }
    });

    return deck;
  }

  function initFlashcards() {
    flashcardDeck = buildFlashcardDeck(fcFilterTable);
    fcIndex = 0;
    renderFlashcard();
  }

  function renderFlashcard() {
    if (flashcardDeck.length === 0) return;
    flashcardInner.classList.remove('flipped');

    const card = flashcardDeck[fcIndex];
    flashcardFrontText.textContent = `${card.a} × ${card.b}`;
    flashcardBackText.textContent = card.answer;
    cardCountBadge.textContent = `Card ${fcIndex + 1} / ${flashcardDeck.length}`;
  }

  function flipFlashcard() {
    flashcardInner.classList.toggle('flipped');
    sound.playClick();
  }

  function nextFlashcard() {
    if (fcIndex < flashcardDeck.length - 1) {
      fcIndex++;
    } else {
      fcIndex = 0; // Loop back
    }
    renderFlashcard();
  }

  function prevFlashcard() {
    if (fcIndex > 0) {
      fcIndex--;
    } else {
      fcIndex = flashcardDeck.length - 1;
    }
    renderFlashcard();
  }

  flashcardBox.addEventListener('click', flipFlashcard);
  fcFlipBtn.addEventListener('click', flipFlashcard);
  fcNextBtn.addEventListener('click', nextFlashcard);
  fcPrevBtn.addEventListener('click', prevFlashcard);

  fcShuffleBtn.addEventListener('click', () => {
    for (let i = flashcardDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flashcardDeck[i], flashcardDeck[j]] = [flashcardDeck[j], flashcardDeck[i]];
    }
    fcIndex = 0;
    renderFlashcard();
    sound.playClick();
  });

  flashcardFilterGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    flashcardFilterGrid.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    fcFilterTable = btn.dataset.table;
    initFlashcards();
  });

  // Keyboard navigation for Flashcards & Global Shortcuts
  window.addEventListener('keydown', (e) => {
    const activeTab = document.querySelector('.nav-tab-btn.active');
    if (!activeTab) return;

    if (activeTab.id === 'tab-flashcards') {
      if (e.code === 'Space') {
        e.preventDefault();
        flipFlashcard();
      } else if (e.code === 'ArrowRight') {
        nextFlashcard();
      } else if (e.code === 'ArrowLeft') {
        prevFlashcard();
      }
    }
  });

  // --- 3. Interactive Table Grid Logic ---
  const gridTable = document.getElementById('interactive-grid-table');
  const gridCalcDisplay = document.getElementById('grid-calc-display');
  const gridSize10Btn = document.getElementById('grid-size-10');
  const gridSize12Btn = document.getElementById('grid-size-12');
  const gridMaskToggle = document.getElementById('grid-mask-toggle');

  let currentGridSize = 10;
  let isGridMasked = false;

  function renderGrid() {
    gridTable.innerHTML = '';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.textContent = '×';
    headerRow.appendChild(cornerTh);

    for (let c = 1; c <= currentGridSize; c++) {
      const th = document.createElement('th');
      th.textContent = c;
      th.dataset.col = c;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    gridTable.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    for (let r = 1; r <= currentGridSize; r++) {
      const tr = document.createElement('tr');
      const rowHeader = document.createElement('th');
      rowHeader.textContent = r;
      rowHeader.dataset.row = r;
      tr.appendChild(rowHeader);

      for (let c = 1; c <= currentGridSize; c++) {
        const td = document.createElement('td');
        const prod = r * c;
        td.textContent = prod;
        td.dataset.row = r;
        td.dataset.col = c;
        td.dataset.prod = prod;

        if (isGridMasked) {
          td.classList.add('hidden-cell');
        }

        td.addEventListener('mouseenter', () => highlightGridCell(r, c, prod));
        td.addEventListener('click', () => {
          if (isGridMasked && td.classList.contains('hidden-cell')) {
            td.classList.remove('hidden-cell');
            td.classList.add('revealed');
            sound.playCorrect();
          } else {
            sound.playClick();
          }
          highlightGridCell(r, c, prod);
        });

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    gridTable.appendChild(tbody);
  }

  function highlightGridCell(row, col, prod) {
    gridTable.querySelectorAll('td, th').forEach(el => {
      el.classList.remove('highlighted', 'cell-active');
    });

    // Highlight row header & column header
    const rHeader = gridTable.querySelector(`th[data-row="${row}"]`);
    const cHeader = gridTable.querySelector(`th[data-col="${col}"]`);
    if (rHeader) rHeader.classList.add('highlighted');
    if (cHeader) cHeader.classList.add('highlighted');

    // Highlight row & column cells
    gridTable.querySelectorAll(`td[data-row="${row}"]`).forEach(td => td.classList.add('highlighted'));
    gridTable.querySelectorAll(`td[data-col="${col}"]`).forEach(td => td.classList.add('highlighted'));

    // Highlight target cell
    const cell = gridTable.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      cell.classList.remove('highlighted');
      cell.classList.add('cell-active');
    }

    gridCalcDisplay.innerHTML = `<span><strong>${row}</strong> × <strong>${col}</strong> = <strong>${prod}</strong></span>`;
  }

  gridSize10Btn.addEventListener('click', () => {
    currentGridSize = 10;
    gridSize10Btn.classList.add('selected');
    gridSize12Btn.classList.remove('selected');
    renderGrid();
  });

  gridSize12Btn.addEventListener('click', () => {
    currentGridSize = 12;
    gridSize12Btn.classList.add('selected');
    gridSize10Btn.classList.remove('selected');
    renderGrid();
  });

  gridMaskToggle.addEventListener('click', () => {
    isGridMasked = !isGridMasked;
    gridMaskToggle.classList.toggle('selected', isGridMasked);
    gridMaskToggle.innerHTML = isGridMasked 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Show Numbers`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Hide Numbers (Self Test)`;
    renderGrid();
  });

  // Initialization
  initTheme();
  updateSoundUI();
  initFlashcards();
  renderGrid();

})();
