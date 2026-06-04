/* ============================================
   MATHLINGS — Leaderboard Logic
   ============================================ */

const Leaderboard = {
  async init() {
    if (!App.requireAuth()) return;
    await this.loadData();
  },

  async loadData() {
    try {
      const response = await fetch('Leaderboard.aspx/GetLeaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      this.renderList(result.d);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      App.showToast('Failed to load leaderboard data', 'error');
    }
  },

  getAvatar(avatarStr) {
    if (!avatarStr) return '🧒';
    if (avatarStr === 'student') return '🧒';
    if (avatarStr.startsWith('\\u')) {
      try {
        return JSON.parse('"' + avatarStr + '"');
      } catch (e) {
        return avatarStr;
      }
    }
    return avatarStr;
  },

  renderList(users) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    if (!users || users.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding:var(--space-2xl); color:var(--text-tertiary);">No students found.</div>';
      return;
    }

    const currentUserId = App.state.currentUser.id;

    list.innerHTML = users.map((u, i) => {
      const isCurrent = u.Id === currentUserId;
      let rankDisplay = u.Rank;
      
      return `
        <div class="leaderboard-item rank-${u.Rank} ${isCurrent ? 'lb-current-user' : ''} animate-in" style="animation-delay: ${i * 50}ms">
          <div class="lb-rank">${rankDisplay}</div>
          <div class="lb-user">
            <div class="lb-avatar">${this.getAvatar(u.Avatar)}</div>
            <div>
              <div class="lb-name">${u.Name} ${isCurrent ? '(You)' : ''}</div>
              <div class="lb-level">Level ${u.Level}</div>
            </div>
          </div>
          <div>
            <div class="lb-score">${u.XP.toLocaleString()}</div>
            <div class="lb-score-label">XP</div>
          </div>
        </div>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => Leaderboard.init());
