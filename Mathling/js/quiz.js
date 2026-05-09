/* ============================================
   MATHLINGS — Formula Learning Engine
   ============================================ */

/*
 * BACKEND TODO:
 *   GET  /api/formulas                      → list of formulas
 *   GET  /api/formulas/:id                  → formula detail with all question sets
 *   POST /api/formulas/:id/progress         → save module completion
 *   GET  /api/formulas/:id/progress/:userId → get student progress
 *
 * Questions should NOT be generated client-side in production.
 * They are pre-defined by instructors and stored in the database.
 */

/* ---------- FORMULA DATA ---------- */
const FORMULAS = {
  'SF+4': {
    name: 'SF+4',
    rule: '+5 − 1',
    description: 'Small Friend +4',
    modules: {
      learning: {
        title: 'A. Learning Module',
        icon: '📖',
        tagClass: 'tag-learning',
        description: 'Learn how the abacus moves for this formula',
        useAbacus: true,
        sets: {
          set1: {
            label: 'Set 1 — Static',
            mode: 'static',
            questions: [
              { rows: [2, 1, -2, 4], answer: 5 },
              { rows: [1, 4, 2, -1], answer: 6 },
              { rows: [4, 4, 1, -2], answer: 7 },
              { rows: [6, 2, -5, 4], answer: 7 },
              { rows: [9, -5, 4, -3], answer: 5 },
            ]
          },
          set2: {
            label: 'Set 2 — Flash',
            mode: 'flash',
            /* BACKEND TODO: Populate these questions from the server */
            questions: []
          }
        }
      },
      exerciseAbacus: {
        title: 'B. Exercise (Abacus)',
        icon: '🧮',
        tagClass: 'tag-exercise',
        description: 'Solve using the abacus',
        useAbacus: true,
        sets: {
          set1: {
            label: 'EA Set 1 — Static',
            mode: 'static',
            /* BACKEND TODO: Populate */
            questions: []
          },
          set2: {
            label: 'EA Set 2 — Static',
            mode: 'static',
            /* BACKEND TODO: Populate */
            questions: []
          }
        }
      },
      exerciseMental: {
        title: 'C. Exercise (Mental)',
        icon: '🧠',
        tagClass: 'tag-mental',
        description: 'No abacus! Imagine the beads moving in your mind.',
        useAbacus: false,
        mentalMode: true,
        sets: {
          set1: {
            label: 'EM Set 1 — Flash',
            mode: 'flash',
            /* BACKEND TODO: Populate */
            questions: []
          },
          set2: {
            label: 'EM Set 2 — Flash',
            mode: 'flash',
            /* BACKEND TODO: Populate */
            questions: []
          }
        }
      },
      preparation: {
        title: 'D. Preparation',
        icon: '📝',
        tagClass: 'tag-mental',
        description: 'Prepare for the final assessment — 10 questions, 5 rows each. Use mental!',
        useAbacus: false,
        mentalMode: true,
        sets: {
          set1: {
            label: 'Preparation',
            mode: 'flash',
            /* BACKEND TODO: Populate — 10 questions, 5 rows each */
            questions: []
          }
        }
      },
      assessment: {
        title: 'E. Assessment',
        icon: '🏆',
        tagClass: 'tag-assessment',
        description: '10 questions, 5 rows each. 1 minute time limit!',
        useAbacus: false,
        mentalMode: true,
        timed: true,
        timeLimit: 60,
        sets: {
          set1: {
            label: 'Final Assessment',
            mode: 'flash',
            /* BACKEND TODO: Populate — 10 questions, 5 rows each */
            questions: []
          }
        }
      }
    }
  }
};

/* ---------- ENGINE ---------- */
const Quiz = {
  formula: null,
  moduleKey: null,
  setKey: null,
  questionIndex: 0,
  score: 0,
  totalCorrect: 0,
  answer: '',
  timerInterval: null,
  timeLeft: 60,
  abacus: null,
  flashTimeout: null,
  moduleProgress: {},

  /* ---- Init ---- */
  init() {
    if (!App.requireAuth(['student'])) return;
    this.formula = FORMULAS['SF+4'];
    this.moduleProgress = JSON.parse(localStorage.getItem('mathlings-module-progress') || '{}');
    this.renderSidebar();
    this.showStartScreen();
  },

  /* ---- Sidebar ---- */
  renderSidebar() {
    document.getElementById('formula-name').textContent = this.formula.name;
    document.getElementById('formula-rule').textContent = '= ' + this.formula.rule;
    const nav = document.getElementById('module-nav');
    const modules = this.formula.modules;
    const keys = Object.keys(modules);

    nav.innerHTML = keys.map((key, i) => {
      const m = modules[key];
      const done = this.isModuleDone(key);
      const active = this.moduleKey === key;
      return `<button class="module-nav-item ${active ? 'active' : ''} ${done ? 'completed' : ''}"
                data-module="${key}">
        <span class="mod-icon">${m.icon}</span>
        <span class="mod-label">${m.title}</span>
        ${done ? '<span class="mod-check">✅</span>' : ''}
      </button>`;
    }).join('');

    nav.onclick = (e) => {
      const btn = e.target.closest('.module-nav-item');
      if (!btn) return;
      this.startModule(btn.dataset.module);
    };
  },

  moduleHasQuestions(key) {
    const m = this.formula.modules[key];
    return Object.values(m.sets).some(s => s.questions.length > 0);
  },

  isModuleDone(key) {
    return !!this.moduleProgress[this.formula.name + '_' + key];
  },

  markModuleDone(key) {
    this.moduleProgress[this.formula.name + '_' + key] = true;
    localStorage.setItem('mathlings-module-progress', JSON.stringify(this.moduleProgress));
    this.renderSidebar();
  },

  /* ---- Start Screen ---- */
  showStartScreen() {
    const main = document.getElementById('quiz-main');
    main.innerHTML = `
      <div class="start-screen">
        <div style="font-size:4rem;margin-bottom:var(--space-lg)">🧮</div>
        <h2>Formula: ${this.formula.name}</h2>
        <p>${this.formula.description}<br><strong>${this.formula.name} = ${this.formula.rule}</strong></p>
        <p style="color:var(--text-tertiary);font-size:var(--text-sm);margin-bottom:var(--space-xl)">
          Select a module from the sidebar to begin learning.
        </p>
        <button class="btn btn-primary btn-lg" onclick="Quiz.startModule('learning')">
          📖 Start Learning
        </button>
      </div>`;
  },

  /* ---- Start Module ---- */
  startModule(key) {
    const m = this.formula.modules[key];
    if (!m) return;
    this.moduleKey = key;
    this.setKey = null;
    this.renderSidebar();
    this.showModuleIntro(m);
  },

  showModuleIntro(m) {
    const allSetKeys = Object.keys(m.sets);
    const readySetKeys = allSetKeys.filter(k => m.sets[k].questions.length > 0);
    const emptySetKeys = allSetKeys.filter(k => m.sets[k].questions.length === 0);
    const main = document.getElementById('quiz-main');

    let mentalHTML = '';
    if (m.mentalMode) {
      mentalHTML = `
        <div class="mental-banner">
          <div class="mental-icon">🧠✋</div>
          <h3>Mental Mode</h3>
          <p>You cannot use the abacus for this module.<br>
          Imagine the beads moving in your mind. Don't forget your hand movements! Yay! 🙌</p>
        </div>`;
    }

    let timerHTML = '';
    if (m.timed) {
      timerHTML = `<p style="color:var(--accent-red);font-weight:700;margin-top:var(--space-md)">⏱️ Time Limit: ${m.timeLimit} seconds for all questions!</p>`;
    }

    main.innerHTML = `
      <div class="module-header">
        <span class="module-tag ${m.tagClass}">${m.icon} ${m.title}</span>
        <h2>${m.title}</h2>
        <p>${m.description}</p>
        ${timerHTML}
      </div>
      ${mentalHTML}
      <div style="text-align:center">
        <h3 style="margin-bottom:var(--space-lg)">Choose a Set</h3>
        <div style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap">
          ${readySetKeys.map(sk => `
            <button class="btn btn-primary" onclick="Quiz.startSet('${sk}')">
              ${m.sets[sk].label}
              <span style="display:block;font-size:var(--text-xs);opacity:0.8;margin-top:4px">
                ${m.sets[sk].questions.length} questions • ${m.sets[sk].mode}
              </span>
            </button>
          `).join('')}
          ${emptySetKeys.map(sk => `
            <button class="btn btn-secondary" disabled style="opacity:0.5;cursor:not-allowed">
              ${m.sets[sk].label}
              <span style="display:block;font-size:var(--text-xs);opacity:0.7;margin-top:4px">
                🔜 Coming Soon
              </span>
            </button>
          `).join('')}
        </div>
        ${readySetKeys.length === 0 ? '<p style="color:var(--text-tertiary);margin-top:var(--space-lg)">⏳ No questions have been added to this module yet. Check back soon!</p>' : ''}
      </div>`;
  },

  /* ---- Start Set ---- */
  startSet(setKey) {
    const m = this.formula.modules[this.moduleKey];
    const set = m.sets[setKey];
    if (!set || !set.questions.length) {
      App.showToast('No questions in this set yet', 'info');
      return;
    }
    this.setKey = setKey;
    this.questionIndex = 0;
    this.score = 0;
    this.totalCorrect = 0;
    this.answer = '';

    if (m.timed) {
      this.timeLeft = m.timeLimit;
    }

    this.renderQuestionScreen();
  },

  /* ---- Render Question Screen ---- */
  renderQuestionScreen() {
    const m = this.formula.modules[this.moduleKey];
    const set = m.sets[this.setKey];
    const q = set.questions[this.questionIndex];

    if (!q || this.questionIndex >= set.questions.length) {
      this.showSetComplete();
      return;
    }

    const main = document.getElementById('quiz-main');
    const total = set.questions.length;

    let timerHTML = '';
    if (m.timed) {
      timerHTML = `
        <div class="assessment-timer">
          <div class="timer-value" id="timer-value">${this.timeLeft}s</div>
          <div class="timer-label">Time Remaining</div>
          <div class="timer-bar"><div class="timer-bar-fill" id="timer-fill" style="width:${(this.timeLeft / m.timeLimit) * 100}%"></div></div>
        </div>`;
    }

    let mentalBanner = '';
    if (m.mentalMode && this.questionIndex === 0) {
      mentalBanner = `
        <div class="mental-banner" style="margin-bottom:var(--space-lg)">
          <div class="mental-icon">🧠✋</div>
          <h3>Use Mental Only!</h3>
          <p>Imagine the abacus beads moving. Use your hand movements!</p>
        </div>`;
    }

    let abacusHTML = '';
    if (m.useAbacus) {
      abacusHTML = '<div id="abacus-container"></div>';
    }

    main.innerHTML = `
      <div class="module-header" style="padding-bottom:var(--space-md);margin-bottom:var(--space-lg)">
        <span class="module-tag ${m.tagClass}">${m.icon} ${set.label}</span>
      </div>
      ${timerHTML}
      ${mentalBanner}
      <div class="quiz-progress">
        <div class="quiz-progress-info">
          <span>Question ${this.questionIndex + 1} of ${total}</span>
          <span>${this.totalCorrect}/${this.questionIndex} correct</span>
        </div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${(this.questionIndex / total) * 100}%"></div></div>
      </div>
      <div class="question-area" id="question-area"></div>
      ${abacusHTML}
      <div class="answer-display" id="answer-display">_</div>
      <div class="numpad" id="numpad">
        <button class="numpad-btn" data-value="1">1</button>
        <button class="numpad-btn" data-value="2">2</button>
        <button class="numpad-btn" data-value="3">3</button>
        <button class="numpad-btn" data-value="4">4</button>
        <button class="numpad-btn" data-value="5">5</button>
        <button class="numpad-btn" data-value="6">6</button>
        <button class="numpad-btn" data-value="7">7</button>
        <button class="numpad-btn" data-value="8">8</button>
        <button class="numpad-btn" data-value="9">9</button>
        <button class="numpad-btn" data-value="0">0</button>
        <button class="numpad-btn clear" data-value="clear">C</button>
        <button class="numpad-btn" data-value="back">←</button>
        <button class="numpad-btn submit" data-value="submit" style="grid-column:span 3">✓ Submit</button>
      </div>`;

    // Setup interactions
    this.setupNumpad();
    if (m.useAbacus) this.initAbacus();

    // Render the question
    if (set.mode === 'flash') {
      this.renderFlashQuestion(q);
    } else {
      this.renderStaticQuestion(q);
    }

    // Start timer for assessment
    if (m.timed && this.questionIndex === 0) {
      this.startAssessmentTimer();
    }
  },

  /* ---- Static Question (vertical) ---- */
  renderStaticQuestion(q) {
    const area = document.getElementById('question-area');
    area.innerHTML = `
      <div class="vq-counter">📝</div>
      <div class="vertical-question" id="vq-card">
        ${q.rows.map((r, i) => {
          const isNeg = r < 0;
          const display = isNeg ? ('−' + Math.abs(r)) : (i === 0 ? String(r) : String(r));
          return `<div class="vq-row ${isNeg ? 'negative' : ''}">${display}</div>`;
        }).join('')}
        <div class="vq-separator"></div>
        <div class="vq-answer-slot" id="vq-answer">?</div>
      </div>`;
  },

  /* ---- Flash Question ---- */
  renderFlashQuestion(q) {
    const area = document.getElementById('question-area');
    area.innerHTML = `
      <div class="vq-counter">Watch carefully! 👀</div>
      <div class="vertical-question" style="min-height:180px;justify-content:center;align-items:center;">
        <div class="flash-container" id="flash-container">
          <div class="flash-number" id="flash-num"></div>
        </div>
      </div>`;

    this.playFlashSequence(q.rows, 0);
  },

  playFlashSequence(rows, index) {
    if (index >= rows.length) {
      // Show "?" after all numbers flashed
      const el = document.getElementById('flash-num');
      if (el) {
        el.textContent = '?';
        el.className = 'flash-number show';
        el.style.color = 'var(--accent-blue)';
      }
      return;
    }

    const el = document.getElementById('flash-num');
    if (!el) return;

    const r = rows[index];
    const isNeg = r < 0;
    const display = isNeg ? ('−' + Math.abs(r)) : (index === 0 ? String(r) : String(r));

    el.textContent = display;
    el.className = `flash-number show ${isNeg ? 'negative' : ''}`;
    el.style.color = isNeg ? 'var(--accent-red)' : 'var(--text-primary)';

    this.flashTimeout = setTimeout(() => {
      el.className = 'flash-number';
      setTimeout(() => {
        this.playFlashSequence(rows, index + 1);
      }, 200);
    }, 1200);
  },

  /* ---- Abacus ---- */
  initAbacus() {
    const container = document.getElementById('abacus-container');
    if (!container) return;
    this.abacus = new Abacus(container, { rods: 4 });
  },

  /* ---- Numpad ---- */
  setupNumpad() {
    const numpad = document.getElementById('numpad');
    if (!numpad) return;
    // Remove old listeners by replacing node
    const newNumpad = numpad.cloneNode(true);
    numpad.parentNode.replaceChild(newNumpad, numpad);

    newNumpad.addEventListener('click', (e) => {
      const btn = e.target.closest('.numpad-btn');
      if (!btn) return;
      const val = btn.dataset.value;
      if (val === 'clear') { this.answer = ''; }
      else if (val === 'back') { this.answer = this.answer.slice(0, -1); }
      else if (val === 'submit') { this.checkAnswer(); return; }
      else { if (this.answer.length < 5) this.answer += val; }
      document.getElementById('answer-display').textContent = this.answer || '_';
      const vqA = document.getElementById('vq-answer');
      if (vqA) vqA.textContent = this.answer || '?';
    });
  },

  /* ---- Check Answer ---- */
  checkAnswer() {
    clearTimeout(this.flashTimeout);
    const m = this.formula.modules[this.moduleKey];
    const set = m.sets[this.setKey];
    const q = set.questions[this.questionIndex];
    if (!q) return;

    const userAnswer = parseInt(this.answer);
    const correct = userAnswer === q.answer;

    if (correct) {
      this.totalCorrect++;
      this.score += 10;
    }

    this.showFeedback(correct, q.answer);
  },

  /* ---- Feedback ---- */
  showFeedback(correct, rightAnswer) {
    const overlay = document.getElementById('feedback-overlay');
    document.getElementById('feedback-icon').textContent = correct ? '🎉' : '😅';
    document.getElementById('feedback-title').textContent = correct ? 'Correct!' : 'Not Quite!';
    document.getElementById('feedback-text').textContent = correct
      ? 'Great job! Keep going!'
      : `The answer was ${rightAnswer}. Keep trying!`;
    overlay.classList.add('show');
    if (correct && typeof App !== 'undefined') App.confetti();

    setTimeout(() => {
      overlay.classList.remove('show');
      this.questionIndex++;
      this.answer = '';

      const m = this.formula.modules[this.moduleKey];
      const set = m.sets[this.setKey];
      if (this.questionIndex >= set.questions.length) {
        this.showSetComplete();
      } else {
        this.renderQuestionScreen();
      }
    }, 1500);
  },

  /* ---- Assessment Timer ---- */
  startAssessmentTimer() {
    clearInterval(this.timerInterval);
    const m = this.formula.modules[this.moduleKey];
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      const tv = document.getElementById('timer-value');
      const tf = document.getElementById('timer-fill');
      if (tv) {
        tv.textContent = this.timeLeft + 's';
        if (this.timeLeft <= 10) tv.className = 'timer-value danger';
        else if (this.timeLeft <= 20) tv.className = 'timer-value warning';
      }
      if (tf) tf.style.width = (this.timeLeft / m.timeLimit) * 100 + '%';

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.showSetComplete();
      }
    }, 1000);
  },

  /* ---- Set Complete ---- */
  showSetComplete() {
    clearInterval(this.timerInterval);
    clearTimeout(this.flashTimeout);

    const m = this.formula.modules[this.moduleKey];
    const set = m.sets[this.setKey];
    const total = set.questions.length;
    const pct = total > 0 ? Math.round((this.totalCorrect / total) * 100) : 0;

    // Check if all sets in module are done
    this.markModuleDone(this.moduleKey);

    const main = document.getElementById('quiz-main');
    main.innerHTML = `
      <div class="module-complete">
        <div style="font-size:4rem;margin-bottom:var(--space-md)">${pct >= 80 ? '🎊' : pct >= 50 ? '👍' : '💪'}</div>
        <h2>${set.label} — Complete!</h2>
        <div class="completion-stats">
          <div class="completion-stat">
            <div class="cs-value">${this.totalCorrect}/${total}</div>
            <div class="cs-label">Correct</div>
          </div>
          <div class="completion-stat">
            <div class="cs-value">${pct}%</div>
            <div class="cs-label">Score</div>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-md);justify-content:center;flex-wrap:wrap;margin-top:var(--space-xl)">
          <button class="btn btn-secondary" onclick="Quiz.startSet('${this.setKey}')">↺ Retry</button>
          <button class="btn btn-primary" onclick="Quiz.showModuleIntro(Quiz.formula.modules['${this.moduleKey}'])">← Back to Module</button>
        </div>
      </div>`;

    if (typeof App !== 'undefined') App.confetti();

    /* BACKEND TODO: POST /api/formulas/:id/progress { module, set, score, correct, total } */
  },
};

document.addEventListener('DOMContentLoaded', () => Quiz.init());
