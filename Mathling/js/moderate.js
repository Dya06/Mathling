/* ============================================
   MATHLINGS — Content Moderation Logic
   Complete quiz builder + review queue
   ============================================ */

const Moderate = {
  statusFilter: 'all',
  subsData: [],
  formulas: [],
  modules: [],
  questionCount: 0,

  async init() {
    if (!App.requireAuth(['instructor', 'admin'])) return;
    const role = App.state.currentUser.role;

    // Show quiz builder for instructors only
    if (role === 'instructor') {
      document.getElementById('submit-section').style.display = 'block';
      await this.loadFormulas();
      this.setupQuizBuilder();
    }

    if (role === 'admin') {
      document.getElementById('review-actions-note').style.display = 'block';
    }

    this.setupFilters();
    await this.fetchSubs();
    this.renderList();
  },

  // ---- Formula/Module Dropdowns ----
  async loadFormulas() {
    try {
      const res = await fetch('Moderate.aspx/GetFormulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      const data = await res.json();
      this.formulas = data.d || [];
      const select = document.getElementById('quiz-formula');
      select.innerHTML = '<option value="">-- Select Formula --</option>' +
        this.formulas.map(f => `<option value="${f.id}">${f.name} (${f.rule})</option>`).join('');
    } catch (e) {
      console.error('Failed to load formulas', e);
    }
  },

  async loadModules(formulaId) {
    const select = document.getElementById('quiz-module');
    if (!formulaId) {
      select.innerHTML = '<option value="">Select a formula first</option>';
      select.disabled = true;
      return;
    }
    try {
      const res = await fetch('Moderate.aspx/GetModules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formulaId })
      });
      const data = await res.json();
      this.modules = data.d || [];
      select.disabled = false;
      select.innerHTML = '<option value="">-- Select Module --</option>' +
        this.modules.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
    } catch (e) {
      console.error('Failed to load modules', e);
    }
  },

  // ---- Quiz Builder ----
  setupQuizBuilder() {
    document.getElementById('quiz-formula').addEventListener('change', (e) => {
      this.loadModules(e.target.value);
    });

    document.getElementById('add-question-btn').addEventListener('click', () => {
      this.addQuestion();
    });

    document.getElementById('submit-quiz-btn').addEventListener('click', () => {
      this.submitQuiz();
    });

    // Start with 3 questions by default
    for (let i = 0; i < 3; i++) this.addQuestion();
  },

  addQuestion() {
    this.questionCount++;
    const idx = this.questionCount;
    const container = document.getElementById('questions-container');

    const card = document.createElement('div');
    card.className = 'question-builder-card';
    card.id = `question-${idx}`;
    card.innerHTML = `
      <div class="question-builder-header">
        <strong>Question ${idx}</strong>
        <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Moderate.removeQuestion(${idx})">✕</button>
      </div>
      <div class="question-builder-body">
        <div class="operand-grid">
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-size:var(--text-xs)">Row 1</label>
            <input type="number" class="form-input operand-input" data-q="${idx}" placeholder="e.g. 4" onchange="Moderate.calcAnswer(${idx})">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-size:var(--text-xs)">Row 2</label>
            <input type="number" class="form-input operand-input" data-q="${idx}" placeholder="e.g. 4" onchange="Moderate.calcAnswer(${idx})">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-size:var(--text-xs)">Row 3</label>
            <input type="number" class="form-input operand-input" data-q="${idx}" placeholder="e.g. -3" onchange="Moderate.calcAnswer(${idx})">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-size:var(--text-xs)">Row 4</label>
            <input type="number" class="form-input operand-input" data-q="${idx}" placeholder="e.g. 2" onchange="Moderate.calcAnswer(${idx})">
          </div>
        </div>
        <div class="answer-preview" id="answer-${idx}">
          Answer: <strong>—</strong>
        </div>
      </div>
    `;
    container.appendChild(card);
  },

  removeQuestion(idx) {
    const el = document.getElementById(`question-${idx}`);
    if (el) el.remove();
    // Check if at least 1 question remains
    const remaining = document.querySelectorAll('.question-builder-card');
    if (remaining.length === 0) this.addQuestion();
  },

  calcAnswer(idx) {
    const inputs = document.querySelectorAll(`input.operand-input[data-q="${idx}"]`);
    let sum = 0;
    let allFilled = true;
    inputs.forEach(inp => {
      if (inp.value === '') { allFilled = false; return; }
      sum += parseInt(inp.value) || 0;
    });
    const preview = document.getElementById(`answer-${idx}`);
    if (allFilled) {
      preview.innerHTML = `Answer: <strong style="color:var(--accent-green)">${sum}</strong>`;
    } else {
      preview.innerHTML = `Answer: <strong>—</strong>`;
    }
  },

  async submitQuiz() {
    const moduleId = document.getElementById('quiz-module').value;
    const label = document.getElementById('quiz-label').value.trim();
    const displayMode = document.getElementById('quiz-display').value;

    if (!document.getElementById('quiz-formula').value) {
      return App.showToast('Please select a formula', 'error');
    }
    if (!moduleId) return App.showToast('Please select a module', 'error');
    if (!label) return App.showToast('Please enter a set label', 'error');

    // Collect questions
    const questionCards = document.querySelectorAll('.question-builder-card');
    if (questionCards.length === 0) return App.showToast('Add at least one question', 'error');

    const questions = [];
    let valid = true;

    questionCards.forEach(card => {
      const inputs = card.querySelectorAll('input.operand-input');
      const rows = [];
      inputs.forEach(inp => {
        if (inp.value === '') { valid = false; return; }
        rows.push(parseInt(inp.value));
      });
      if (rows.length === 4) {
        questions.push({
          rows: rows,
          answer: rows.reduce((a, b) => a + b, 0)
        });
      }
    });

    if (!valid || questions.length === 0) {
      return App.showToast('Please fill in all operand rows for every question', 'error');
    }

    try {
      const res = await fetch('Moderate.aspx/SubmitQuiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          label,
          displayMode,
          questionsJson: JSON.stringify(questions)
        })
      });
      const data = await res.json();

      if (data.d === 'success') {
        App.showToast('Quiz submitted for review!', 'success');
        // Reset form
        document.getElementById('quiz-label').value = '';
        document.getElementById('questions-container').innerHTML = '';
        this.questionCount = 0;
        for (let i = 0; i < 3; i++) this.addQuestion();
        await this.fetchSubs();
        this.renderList();
      } else {
        App.showToast('Failed: ' + data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error submitting quiz', 'error');
    }
  },

  // ---- Review Queue ----
  async fetchSubs() {
    try {
      const res = await fetch('Moderate.aspx/GetSubmissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: App.state.currentUser.id.toString(),
          role: App.state.currentUser.role
        })
      });
      const data = await res.json();
      this.subsData = data.d || [];
    } catch (e) {
      console.error('Failed to fetch submissions', e);
      this.subsData = [];
    }
  },

  renderList() {
    const subs = this.subsData.filter(s => this.statusFilter === 'all' || s.status === this.statusFilter);
    const isAdmin = App.state.currentUser.role === 'admin';
    const list = document.getElementById('review-list');

    list.innerHTML = subs.length ? subs.map(s => `
      <div class="review-card">
        <div class="review-card-header">
          <h3 class="review-card-title">${s.label}</h3>
          <span class="status-pill status-${s.status}">${s.status}</span>
        </div>
        <div class="review-card-meta">
          <span>Formula: ${s.formulaName}</span>
          <span>Module: ${s.moduleTitle}</span>
          <span>Mode: ${s.displayMode}</span>
          <span>Questions: ${s.questionCount}</span>
          ${s.instructor ? `<span>Instructor: ${s.instructor}</span>` : ''}
          ${s.date ? `<span>Date: ${s.date}</span>` : ''}
        </div>
        ${s.reason ? `<div class="reject-reason">Reason: ${s.reason}</div>` : ''}
        ${isAdmin ? `
          <div class="review-card-actions">
            ${s.status === 'pending' ? `
            <button type="button" class="btn btn-accent-green btn-sm" onclick="Moderate.approveItem('${s.id}')">Approve</button>
            <button type="button" class="btn btn-accent-red btn-sm" onclick="Moderate.rejectPrompt('${s.id}')">Reject</button>
            ` : ''}
            <button type="button" class="btn btn-ghost btn-sm" style="color:var(--accent-red)" onclick="Moderate.deletePrompt('${s.id}')">Delete</button>
          </div>
        ` : ''}
      </div>
    `).join('') : '<div class="empty-state"><h3>No submissions</h3><p>Nothing to review here.</p></div>';
  },

  async approveItem(id) {
    try {
      const res = await fetch('Moderate.aspx/UpdateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: id, status: 'approved', reason: '' })
      });
      const data = await res.json();
      if (data.d === 'success') {
        App.showToast('Quiz approved! It will now appear for students', 'success');
        await this.fetchSubs();
        this.renderList();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error approving content', 'error');
    }
  },

  rejectPrompt(id) {
    const reason = prompt('Reason for rejection:');
    if (reason !== null && reason.trim()) {
      this.rejectItem(id, reason.trim());
    }
  },

  async rejectItem(id, reason) {
    try {
      const res = await fetch('Moderate.aspx/UpdateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: id, status: 'rejected', reason: reason })
      });
      const data = await res.json();
      if (data.d === 'success') {
        App.showToast('Quiz rejected', 'error');
        await this.fetchSubs();
        this.renderList();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error rejecting content', 'error');
    }
  },

  deletePrompt(id) {
    if (confirm('Are you sure you want to permanently delete this quiz set? This action cannot be undone.')) {
      this.deleteItem(id);
    }
  },

  async deleteItem(id) {
    try {
      const res = await fetch('Moderate.aspx/DeleteContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: id })
      });
      const data = await res.json();
      if (data.d === 'success') {
        App.showToast('Quiz set deleted permanently', 'success');
        await this.fetchSubs();
        this.renderList();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error deleting content', 'error');
    }
  },

  setupFilters() {
    document.querySelectorAll('.status-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.status-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.statusFilter = btn.dataset.status;
        this.renderList();
      });
    });
  },
};

document.addEventListener('DOMContentLoaded', () => Moderate.init());
