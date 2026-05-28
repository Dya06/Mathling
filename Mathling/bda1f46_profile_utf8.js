/* ============================================
   MATHLINGS ΓÇö Profile Page Logic
   ============================================ */

const Profile = {
  async init() {
    if (!App.requireAuth()) return;
    
    const user = App.state.currentUser;
    try {
      const response = await fetch('Profile.aspx/GetProfileData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: user.role })
      });
      const result = await response.json();
      const profileData = result.d;
      
      if (profileData && profileData.errorMessage) {
        console.error("Backend Error:", profileData.errorMessage);
        App.showToast('Backend Error: ' + profileData.errorMessage, 'error');
        return;
      }
      
      this.render(user, profileData);
    } catch (e) {
      console.error('Failed to load profile data', e);
      App.showToast('Failed to load profile data', 'error');
    }
  },

  render(user, data) {
    const container = document.getElementById('profile-content');
    if (!container) return;

    document.getElementById('profile-avatar').textContent = user.avatar || '\uD83D\uDC64';
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-role-badge').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    const renderers = {
      student: () => this.renderStudent(container, user, data.student),
      parent: () => this.renderParent(container, user, data.parent),
      instructor: () => this.renderInstructor(container, user, data.instructor),
      admin: () => this.renderAdmin(container, user, data.admin),
    };
    (renderers[user.role] || renderers.student)();
  },

  renderStudent(container, user, data) {
    const badges = data.badges || [];
    const chapters = data.chapters || [];
    const history = data.history || [];
    const xp = data.xp || 0;
    const level = data.level || 1;
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
          <h3 class="profile-section-title">Achievements</h3>
          <div class="badges-grid" id="badges-grid">
            ${badges.length ? badges.map(b => `
              <div class="badge-item ${b.earned ? '' : 'locked'}">
                <span class="badge-icon">${b.icon}</span>
                <span class="badge-label">${b.name}</span>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary);grid-column:span 3;text-align:center">No badges yet start quizzing to earn them!</p>'}
          </div>
          <h3 class="profile-section-title" style="margin-top:var(--space-2xl)">Quick Stats</h3>
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${totalQuizzes}</div><div class="stat-label">Quizzes Taken</div></div>
            <div class="stat-card"><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
            <div class="stat-card"><div class="stat-value">${badgesEarned}</div><div class="stat-label">Badges Earned</div></div>
            <div class="stat-card"><div class="stat-value">${chaptersDone}/${chapters.length}</div><div class="stat-label">Chapters Done</div></div>
          </div>
        </div>
        <div>
          <h3 class="profile-section-title">Chapter Progress</h3>
          <div class="chapter-list" id="chapter-list">
            ${chapters.length ? chapters.map(c => `
              <div class="chapter-item ${c.unlocked ? '' : 'locked'}">
                <div class="chapter-icon" style="background:${c.completed ? 'var(--accent-green-light)' : c.unlocked ? 'var(--accent-blue-light)' : 'var(--bg-secondary)'}">
                  ${c.completed ? 'V' : c.unlocked ? 'O' : 'X'}
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
          <h3 class="profile-section-title" style="margin-top:var(--space-2xl)">Recent Activity</h3>
          <div class="activity-list" id="activity-list">
            ${history.length ? history.map(h => `
              <div class="activity-item">
                <div class="activity-dot"></div>
                <span>Scored <strong>${h.score}%</strong> on ${h.chapter}</span>
                <span class="activity-time">${h.date}</span>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary)">No activity yet take your first quiz!</p>'}
          </div>
        </div>
      </div>`;
  },

  renderParent(container, user, data) {
    const students = data.linkedStudents || [];
    const totalQuizzes = students.reduce((sum, s) => sum + (s.totalQuizzes || 0), 0);
    const avgScore = 0; // Requires actual math on child scores

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">Linked Students</h3>
          <div id="linked-students">
            ${students.length ? students.map(s => `
              <div class="card" style="margin-bottom:var(--space-sm);display:flex;justify-content:space-between">
                <div><strong>${s.name}</strong></div>
                <div style="color:var(--text-tertiary)">Level ${s.level} | ${s.xp} XP</div>
              </div>
            `).join('') : '<p style="color:var(--text-tertiary);padding:var(--space-lg)">No students linked yet.</p>'}
          </div>
          <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:var(--space-md)">+ Link a Student</button>
        </div>
        <div>
          <h3 class="profile-section-title">Performance Overview</h3>
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${totalQuizzes}</div><div class="stat-label">Quizzes Taken</div></div>
            <div class="stat-card"><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
          </div>
          <a href="Progress.aspx" class="btn btn-accent-blue btn-sm" style="width:100%;margin-top:var(--space-lg)">View Full Progress</a>
        </div>
      </div>`;
  },

  renderInstructor(container, user, data) {
    const subs = data.submissions || [];

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">My Submissions</h3>
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
          <h3 class="profile-section-title">Quick Links</h3>
          <a href="Forum.aspx" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:var(--space-sm)">Community Forum</a>
          <a href="Moderate.aspx" class="btn btn-secondary btn-sm" style="width:100%">Submit Content</a>
        </div>
      </div>`;
  },

  renderAdmin(container, user, data) {
    const totalUsers = data.totalUsers || 0;
    const totalStudents = data.totalStudents || 0;

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">Quick Stats</h3>
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${totalUsers}</div><div class="stat-label">Total Users</div></div>
            <div class="stat-card"><div class="stat-value">${totalStudents}</div><div class="stat-label">Students</div></div>
          </div>
        </div>
        <div>
          <h3 class="profile-section-title">Admin Tools</h3>
          <a href="Admin.aspx" class="btn btn-accent-blue btn-sm" style="width:100%;margin-bottom:var(--space-sm)">Admin Dashboard</a>
          <a href="Moderate.aspx" class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:var(--space-sm)">Content Moderation</a>
          <a href="Progress.aspx" class="btn btn-secondary btn-sm" style="width:100%">View Reports</a>
        </div>
      </div>`;
  },
};

document.addEventListener('DOMContentLoaded', () => Profile.init());
