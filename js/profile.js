/* ============================================
   MATHLINGS — Profile Page Logic
   ============================================ */

/*
 * BACKEND TODO:
 * All profile data should be fetched from the server:
 *
 *   GET /api/users/:id/profile         → user info, level, XP
 *   GET /api/users/:id/badges          → earned/unearned badge list
 *   GET /api/users/:id/chapters        → chapter progress with stars
 *   GET /api/users/:id/quiz-history    → recent quiz results
 *   GET /api/users/:id/linked-students → (parent role) linked student accounts
 *   GET /api/submissions?instructor=:id → (instructor role) their submissions
 *   GET /api/admin/stats               → (admin role) platform statistics
 *
 * Profile updates:
 *   PUT /api/users/:id/profile  { name, avatar, bio, etc. }
 *
 * Parent linking:
 *   POST /api/users/:parentId/link-student  { studentCode }
 *   DELETE /api/users/:parentId/unlink-student/:studentId
 */

const Profile = {
  init() {
    if (!App.requireAuth()) return;
    this.render();
  },

  render() {
    const user = App.state.currentUser;
    const container = document.getElementById('profile-content');
    if (!container) return;

    document.getElementById('profile-avatar').textContent = user.avatar || '👤';
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-role-badge').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    const renderers = {
      student: () => this.renderStudent(container),
      parent: () => this.renderParent(container),
      instructor: () => this.renderInstructor(container),
      admin: () => this.renderAdmin(container),
    };
    (renderers[user.role] || renderers.student)();
  },

  renderStudent(container) {
    const user = App.state.currentUser;
    /*
     * BACKEND TODO:
     * Fetch all this data from the server:
     *   const badges = await fetch(`/api/users/${user.id}/badges`).then(r => r.json());
     *   const chapters = await fetch(`/api/users/${user.id}/chapters`).then(r => r.json());
     *   const history = await fetch(`/api/users/${user.id}/quiz-history`).then(r => r.json());
     *   const { level, xp, nextLevelXp } = await fetch(`/api/users/${user.id}/profile`).then(r => r.json());
     */
    const badges = JSON.parse(localStorage.getItem('mathlings-badges') || '[]');
    const chapters = JSON.parse(localStorage.getItem('mathlings-chapters') || '[]');
    const history = JSON.parse(localStorage.getItem('mathlings-quiz-history') || '[]');
    const xp = user.xp || 0;
    const level = user.level || 1;
    const nextLevelXp = level * 500;

    document.getElementById('level-section').style.display = 'block';
    document.getElementById('level-num').textContent = `Level ${level}`;
    document.getElementById('xp-text').textContent = `${xp} / ${nextLevelXp} XP`;
    document.getElementById('xp-fill').style.width = `${(xp / nextLevelXp) * 100}%`;

    const totalQuizzes = history.length;
    const avgScore = totalQuizzes ? Math.round(history.reduce((a, h) => a + h.score, 0) / totalQuizzes) : 0;
    const badgesEarned = badges.filter(b => b.earned).length;
    const chaptersDone = chapters.filter(c => c.completed).length;

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">🏆 Achievements</h3>
          <div class="badges-grid" id="badges-grid">
            <!-- BACKEND TODO: Populate from GET /api/users/:id/badges -->
            ${badges.length ? badges.map(b => `
              <div class="badge-item ${b.earned ? '' : 'locked'}">
                <span class="badge-icon">${b.icon}</span>
                <span class="badge-label">${b.name}</span>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary);grid-column:span 3;text-align:center">No badges yet — start quizzing to earn them!</p>'}
          </div>
          <h3 class="profile-section-title" style="margin-top:var(--space-2xl)">📊 Quick Stats</h3>
          <!-- BACKEND TODO: Populate from GET /api/users/:id/stats -->
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${totalQuizzes}</div><div class="stat-label">Quizzes Taken</div></div>
            <div class="stat-card"><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
            <div class="stat-card"><div class="stat-value">${badgesEarned}</div><div class="stat-label">Badges Earned</div></div>
            <div class="stat-card"><div class="stat-value">${chaptersDone}/${chapters.length}</div><div class="stat-label">Chapters Done</div></div>
          </div>
        </div>
        <div>
          <h3 class="profile-section-title">📖 Chapter Progress</h3>
          <div class="chapter-list" id="chapter-list">
            <!-- BACKEND TODO: Populate from GET /api/users/:id/chapters -->
            ${chapters.length ? chapters.map(c => `
              <div class="chapter-item ${c.unlocked ? '' : 'locked'}">
                <div class="chapter-icon" style="background:${c.completed ? 'var(--accent-green-light)' : c.unlocked ? 'var(--accent-blue-light)' : 'var(--bg-secondary)'}">
                  ${c.completed ? '✅' : c.unlocked ? '📖' : '🔒'}
                </div>
                <div class="chapter-info">
                  <div class="chapter-title">${c.title}</div>
                  <div class="chapter-desc">${c.description}</div>
                </div>
                <div class="chapter-stars">
                  ${[1,2,3].map(s => `<svg viewBox="0 0 24 24" class="${s <= c.stars ? '' : 'empty'}" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('')}
                </div>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary)">No chapters available yet.</p>'}
          </div>
          <h3 class="profile-section-title" style="margin-top:var(--space-2xl)">📝 Recent Activity</h3>
          <div class="activity-list" id="activity-list">
            <!-- BACKEND TODO: Populate from GET /api/users/:id/quiz-history?limit=4 -->
            ${history.length ? history.slice(-4).reverse().map(h => `
              <div class="activity-item">
                <div class="activity-dot"></div>
                <span>Scored <strong>${h.score}%</strong> on ${h.chapter}</span>
                <span class="activity-time">${h.date}</span>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary)">No activity yet — take your first quiz!</p>'}
          </div>
        </div>
      </div>`;
  },

  renderParent(container) {
    /*
     * BACKEND TODO:
     * Fetch linked students: GET /api/users/:parentId/linked-students
     * Each linked student should include their name, level, XP, and recent performance summary.
     * Fetch performance overview: GET /api/users/:parentId/children-stats
     */
    const history = JSON.parse(localStorage.getItem('mathlings-quiz-history') || '[]');
    const totalQuizzes = history.length;
    const avgScore = totalQuizzes ? Math.round(history.reduce((a, h) => a + h.score, 0) / totalQuizzes) : 0;

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">👧 Linked Students</h3>
          <!-- BACKEND TODO: Populate from GET /api/users/:parentId/linked-students -->
          <div id="linked-students">
            <p style="color:var(--text-tertiary);padding:var(--space-lg)">No students linked yet. Use the button below to link a student account.</p>
          </div>
          <!-- BACKEND TODO: POST /api/users/:parentId/link-student { studentCode } -->
          <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:var(--space-md)">+ Link a Student</button>
        </div>
        <div>
          <h3 class="profile-section-title">📊 Performance Overview</h3>
          <!-- BACKEND TODO: Populate from GET /api/users/:parentId/children-stats -->
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${totalQuizzes}</div><div class="stat-label">Quizzes Taken</div></div>
            <div class="stat-card"><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
          </div>
          <a href="progress.html" class="btn btn-accent-blue btn-sm" style="width:100%;margin-top:var(--space-lg)">View Full Progress →</a>
        </div>
      </div>`;
  },

  renderInstructor(container) {
    /*
     * BACKEND TODO:
     * Fetch instructor's submissions: GET /api/submissions?instructor=:id
     */
    const subs = JSON.parse(localStorage.getItem('mathlings-submissions') || '[]');

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">📋 My Submissions</h3>
          <!-- BACKEND TODO: Populate from GET /api/submissions?instructor=:id -->
          <div class="stats-cards" style="margin-bottom:var(--space-lg)">
            <div class="stat-card"><div class="stat-value">${subs.length}</div><div class="stat-label">Total</div></div>
            <div class="stat-card"><div class="stat-value">${subs.filter(s => s.status === 'approved').length}</div><div class="stat-label">Approved</div></div>
          </div>
          <div id="submissions-list">
            ${subs.length ? subs.map(s => `
              <div class="card" style="margin-bottom:var(--space-sm);display:flex;align-items:center;gap:var(--space-md)">
                <div style="flex:1"><div style="font-weight:700;font-size:var(--text-sm)">${s.title}</div><div style="font-size:var(--text-xs);color:var(--text-tertiary)">${s.chapter}</div></div>
                <span class="status-pill status-${s.status}">${s.status}</span>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary)">No submissions yet.</p>'}
          </div>
        </div>
        <div>
          <h3 class="profile-section-title">🔗 Quick Links</h3>
          <a href="forum.html" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:var(--space-sm)">Community Forum</a>
          <a href="moderate.html" class="btn btn-secondary btn-sm" style="width:100%">Submit Content</a>
        </div>
      </div>`;
  },

  renderAdmin(container) {
    /*
     * BACKEND TODO:
     * Fetch admin stats: GET /api/admin/stats
     * Returns { totalUsers, totalStudents, totalQuizzes, systemHealth, etc. }
     */
    const users = JSON.parse(localStorage.getItem('mathlings-users') || '[]');

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">⚡ Quick Stats</h3>
          <!-- BACKEND TODO: Populate from GET /api/admin/stats -->
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${users.length}</div><div class="stat-label">Total Users</div></div>
            <div class="stat-card"><div class="stat-value">${users.filter(u => u.role === 'student').length}</div><div class="stat-label">Students</div></div>
          </div>
        </div>
        <div>
          <h3 class="profile-section-title">🔗 Admin Tools</h3>
          <a href="admin.html" class="btn btn-accent-blue btn-sm" style="width:100%;margin-bottom:var(--space-sm)">Admin Dashboard</a>
          <a href="moderate.html" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:var(--space-sm)">Content Moderation</a>
          <a href="progress.html" class="btn btn-secondary btn-sm" style="width:100%">View Reports</a>
        </div>
      </div>`;
  },
};

document.addEventListener('DOMContentLoaded', () => Profile.init());
