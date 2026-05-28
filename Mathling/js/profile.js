/* ============================================
   MATHLINGS — Profile Page Logic
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
      this.setupEditModal();
      this.setupLinkModal();
    } catch (e) {
      console.error('Failed to load profile data', e);
      App.showToast('Failed to load profile data', 'error');
    }
  },

  setupLinkModal() {
    const modal = document.getElementById('link-student-modal');
    const closeBtn = document.getElementById('link-student-close');
    const cancelBtn = document.getElementById('link-student-cancel');
    const saveBtn = document.getElementById('link-student-save');
    const emailInput = document.getElementById('link-student-email');
    const errorMsg = document.getElementById('link-student-error');

    if (!modal) return;

    const openModal = () => {
        emailInput.value = '';
        errorMsg.style.display = 'none';
        modal.classList.add('active');
    };
    const closeModal = () => modal.classList.remove('active');

    const saveChanges = async () => {
        const email = emailInput.value.trim();
        if (!email) return;

        saveBtn.disabled = true;
        saveBtn.textContent = 'Linking...';
        errorMsg.style.display = 'none';

        try {
            const res = await fetch('Profile.aspx/LinkStudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentEmail: email })
            });
            const data = await res.json();
            if (data.d && data.d.success) {
                App.showToast('Student successfully linked!', 'success');
                closeModal();
                Profile.init(); // Reload profile
            } else {
                errorMsg.textContent = data.d.errorMessage || 'Failed to link student';
                errorMsg.style.display = 'block';
            }
        } catch (e) {
            console.error(e);
            errorMsg.textContent = 'A network error occurred.';
            errorMsg.style.display = 'block';
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Link Student';
        }
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveChanges);

    // Make it available to renderParent
    this.openLinkModal = openModal;
  },

  setupEditModal() {
    const editBtn = document.getElementById('edit-profile-btn');
    const modal = document.getElementById('edit-profile-modal');
    const closeBtn = document.getElementById('edit-profile-close');
    const cancelBtn = document.getElementById('edit-profile-cancel');
    const saveBtn = document.getElementById('edit-profile-save');
    const nameInput = document.getElementById('edit-name-input');
    const avatarGrid = document.getElementById('avatar-grid');

    if (!editBtn || !modal) return;

    const avatars = ['🧑', '👩', '👨‍🏫', '🛡️', '😎', '🤖', '🦊', '🦉', '🐱', '🐶', '🦄', '🌟'];
    let selectedAvatar = App.state.currentUser.avatar || '🧑';

    const renderAvatars = () => {
      avatarGrid.innerHTML = avatars.map(a => `
        <div class="avatar-option" style="font-size:2.5rem; cursor:pointer; padding:5px; border-radius:50%; border:2px solid ${a === selectedAvatar ? 'var(--accent-blue)' : 'transparent'}; transition:all 0.2s;" data-avatar="${a}">
          ${a}
        </div>
      `).join('');

      avatarGrid.querySelectorAll('.avatar-option').forEach(el => {
        el.addEventListener('click', (e) => {
          selectedAvatar = e.currentTarget.dataset.avatar;
          renderAvatars();
        });
      });
    };

    const openModal = () => {
      nameInput.value = App.state.currentUser.name;
      selectedAvatar = App.state.currentUser.avatar || '🧑';
      renderAvatars();
      modal.classList.add('active');
    };

    const closeModal = () => modal.classList.remove('active');

    const saveChanges = async () => {
      const newName = nameInput.value.trim();
      if (!newName) {
        App.showToast('Name cannot be empty', 'error');
        return;
      }
      
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      try {
        const response = await fetch('Profile.aspx/UpdateProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, avatar: selectedAvatar })
        });
        const result = await response.json();
        
        if (result.d && result.d.success) {
          App.showToast('Profile updated successfully!', 'success');
          App.state.currentUser.name = newName;
          App.state.currentUser.avatar = selectedAvatar;
          localStorage.setItem('mathlings-user', JSON.stringify(App.state.currentUser));
          
          document.getElementById('profile-name').textContent = newName;
          document.getElementById('profile-avatar').textContent = selectedAvatar;
          App.renderNav();
          closeModal();
        } else {
          App.showToast('Failed to update: ' + (result.d ? result.d.errorMessage : 'Unknown error'), 'error');
        }
      } catch (e) {
        console.error(e);
        App.showToast('Error saving profile', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    };

    editBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveChanges);
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
    const chaptersDone = chapters.filter(c => c.completed).length;

    container.innerHTML = `
      <div class="profile-grid">
        <div>
          <h3 class="profile-section-title">Quick Stats</h3>
          <div class="stats-cards">
            <div class="stat-card"><div class="stat-value">${totalQuizzes}</div><div class="stat-label">Quizzes Taken</div></div>
            <div class="stat-card"><div class="stat-value">${avgScore}%</div><div class="stat-label">Avg Score</div></div>
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
    let totalScoreSum = 0;
    let totalQuizzes = 0;
    students.forEach(s => {
        const q = s.totalQuizzes || 0;
        totalQuizzes += q;
        totalScoreSum += (s.avgScore || 0) * q;
    });
    const avgScore = totalQuizzes ? Math.round(totalScoreSum / totalQuizzes) : 0;

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
          <button type="button" class="btn btn-secondary btn-sm" id="link-student-btn" style="width:100%;margin-top:var(--space-md)">+ Link a Student</button>
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

    document.getElementById('link-student-btn')?.addEventListener('click', () => {
        if (Profile.openLinkModal) {
            Profile.openLinkModal();
        }
    });
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
