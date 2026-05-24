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
  subsData: [],

  async init() {
    if (!App.requireAuth(['instructor', 'admin'])) return;
    await this.fetchSubs();
    this.render();
    this.setupFilters();
    this.setupSubmitForm();
  },

  async fetchSubs() {
    try {
      const response = await fetch('Moderate.aspx/GetSubmissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: App.state.currentUser.id, 
          role: App.state.currentUser.role 
        })
      });
      const result = await response.json();
      this.subsData = result.d || [];
    } catch (e) {
      console.error('Failed to fetch submissions', e);
      this.subsData = [];
    }
  },

  render() {
    const role = App.state.currentUser.role;
    const isAdmin = role === 'admin';
    document.getElementById('submit-section').style.display = role === 'instructor' ? 'block' : 'none';
    document.getElementById('review-actions-note').style.display = isAdmin ? 'block' : 'none';
    this.renderList();
  },

  renderList() {
    const subs = this.subsData.filter(s => this.statusFilter === 'all' || s.status === this.statusFilter);
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

  async updateStatus(id, status, reason = '') {
    try {
      const response = await fetch('Moderate.aspx/UpdateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, status: status, reason: reason })
      });
      const result = await response.json();
      if (result.d) {
        App.showToast(`Submission ${status}! ${status === 'approved' ? '✅' : '❌'}`, status === 'approved' ? 'success' : 'error');
        await this.fetchSubs();
        this.renderList();
      } else {
        App.showToast('Failed to update status', 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error updating status', 'error');
    }
  },

  rejectPrompt(id) {
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
    document.getElementById('submit-content-btn')?.addEventListener('click', async () => {
      const title = document.getElementById('sub-title').value.trim();
      const chapter = document.getElementById('sub-chapter').value;
      const difficulty = document.getElementById('sub-difficulty').value;
      if (!title) { App.showToast('Please enter a title', 'error'); return; }

      try {
        const response = await fetch('Moderate.aspx/SubmitContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            instructorId: App.state.currentUser.id,
            title: title, 
            chapter: chapter, 
            difficulty: difficulty 
          })
        });
        const result = await response.json();
        
        if (result.d) {
          document.getElementById('sub-title').value = '';
          App.showToast('Content submitted for review! 📤', 'success');
          await this.fetchSubs();
          this.renderList();
        } else {
          App.showToast('Failed to submit content', 'error');
        }
      } catch (e) {
        console.error(e);
        App.showToast('Error submitting content', 'error');
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => Moderate.init());
