/* ============================================
   MATHLINGS — Content Moderation Logic
   ============================================ */

/*
 * BACKEND TODO:
 * Content moderation endpoints:
 *
 *   GET    /api/submissions                       → list all submissions (admin)
 *   GET    /api/submissions?instructor=:id        → instructor's own submissions
 *   GET    /api/submissions?status=pending        → filter by status
 *   POST   /api/submissions                       → create new submission
 *          Body: { title, chapter, difficulty, questions: [...] }
 *   PUT    /api/submissions/:id                   → update submission (admin: approve/reject)
 *          Body: { status: 'approved'|'rejected', reason?: string }
 *   GET    /api/submissions/:id/preview           → preview submission content
 *   DELETE /api/submissions/:id                   → delete (instructor own / admin)
 *
 * Server should:
 *   - Only allow instructors to submit content
 *   - Only allow admins to approve/reject
 *   - Validate question format and answer correctness
 *   - Send notification to instructor when status changes
 *   - Track submission history and revision counts
 *   - Approved content gets added to the chapter question pool
 */

const Moderate = {
  statusFilter: 'all',

  init() {
    if (!App.requireAuth(['instructor', 'admin'])) return;
    this.render();
    this.setupFilters();
    this.setupSubmitForm();
  },

  getSubs() {
    /*
     * BACKEND TODO:
     * Replace with: return await fetch('/api/submissions').then(r => r.json());
     */
    return JSON.parse(localStorage.getItem('mathlings-submissions') || '[]');
  },

  render() {
    const role = App.state.currentUser.role;
    const isAdmin = role === 'admin';
    document.getElementById('submit-section').style.display = role === 'instructor' ? 'block' : 'none';
    document.getElementById('review-actions-note').style.display = isAdmin ? 'block' : 'none';
    this.renderList();
  },

  renderList() {
    const subs = this.getSubs().filter(s => this.statusFilter === 'all' || s.status === this.statusFilter);
    const isAdmin = App.state.currentUser.role === 'admin';
    const list = document.getElementById('review-list');

    list.innerHTML = subs.length ? subs.map(s => `
      <div class="review-card">
        <div class="review-card-header">
          <h3 class="review-card-title">${s.title}</h3>
          <span class="status-pill status-${s.status}">${s.status}</span>
        </div>
        <div class="review-card-meta">
          <span>👨‍🏫 ${s.instructor}</span>
          <span>📖 ${s.chapter}</span>
          <span>📊 ${s.difficulty}</span>
          <span>📅 ${s.date}</span>
        </div>
        ${s.reason ? `<div class="reject-reason">Reason: ${s.reason}</div>` : ''}
        ${isAdmin && s.status === 'pending' ? `
          <div class="review-card-actions">
            <button class="btn btn-accent-green btn-sm" onclick="Moderate.updateStatus(${s.id},'approved')">✓ Approve</button>
            <button class="btn btn-accent-red btn-sm" onclick="Moderate.rejectPrompt(${s.id})">✗ Reject</button>
          </div>
        ` : ''}
      </div>
    `).join('') : '<div class="empty-state"><h3>No submissions</h3><p>Nothing to review here.</p></div>';
  },

  updateStatus(id, status, reason) {
    /*
     * BACKEND TODO:
     * Replace with:
     *   await fetch(`/api/submissions/${id}`, {
     *     method: 'PUT',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ status, reason })
     *   });
     *   // Refresh list from server
     */
    const subs = this.getSubs();
    const s = subs.find(s => s.id === id);
    if (s) { s.status = status; if (reason) s.reason = reason; }
    localStorage.setItem('mathlings-submissions', JSON.stringify(subs));
    this.renderList();
    App.showToast(`Submission ${status}! ${status === 'approved' ? '✅' : '❌'}`, status === 'approved' ? 'success' : 'error');
  },

  rejectPrompt(id) {
    /*
     * BACKEND TODO:
     * Consider replacing prompt() with a proper modal dialog
     * that allows the admin to write a detailed rejection reason.
     */
    const reason = prompt('Reason for rejection:');
    if (reason) this.updateStatus(id, 'rejected', reason);
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

  setupSubmitForm() {
    document.getElementById('submit-content-btn')?.addEventListener('click', () => {
      const title = document.getElementById('sub-title').value.trim();
      const chapter = document.getElementById('sub-chapter').value;
      const difficulty = document.getElementById('sub-difficulty').value;
      if (!title) { App.showToast('Please enter a title', 'error'); return; }

      /*
       * BACKEND TODO:
       * Replace with:
       *   await fetch('/api/submissions', {
       *     method: 'POST',
       *     headers: { 'Content-Type': 'application/json' },
       *     body: JSON.stringify({ title, chapter, difficulty, questions: [...] })
       *   });
       *   // Also need to add a questions editor UI for instructors
       *   // to create actual quiz questions with answers
       */
      const subs = this.getSubs();
      subs.push({
        id: Date.now(), title, chapter, difficulty, status: 'pending',
        instructor: App.state.currentUser.name,
        date: new Date().toISOString().split('T')[0],
      });
      localStorage.setItem('mathlings-submissions', JSON.stringify(subs));
      document.getElementById('sub-title').value = '';
      this.renderList();
      App.showToast('Content submitted for review! 📤', 'success');
    });
  },
};

document.addEventListener('DOMContentLoaded', () => Moderate.init());
