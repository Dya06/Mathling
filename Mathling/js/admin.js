/* ============================================
   MATHLINGS — Admin Dashboard Logic
   ============================================ */

/*
 * BACKEND TODO:
 * Admin dashboard data should come from these endpoints:
 *
 *   GET /api/admin/stats           → { totalUsers, totalQuizzes, contentItems, pendingReviews }
 *   GET /api/admin/users           → paginated user list with search/filter
 *   GET /api/admin/users?role=X    → filter users by role
 *   GET /api/admin/activity        → recent platform activity feed
 *   GET /api/admin/feedback        → user feedback/reports list
 *   GET /api/admin/analytics/weekly → chart data for weekly activity
 *   PUT /api/admin/users/:id       → update user (enable/disable, change role)
 *   DELETE /api/admin/users/:id    → delete user account
 *   GET /api/admin/reports/export?format=csv → export reports
 *
 * Server should:
 *   - Enforce admin-only access on all these endpoints
 *   - Implement real-time activity tracking (WebSocket or polling)
 *   - Cache frequently-accessed stats
 *   - Support date range filtering for analytics
 *   - Implement system health monitoring (uptime, error rates)
 */

const Admin = {
  init() {
    if (!App.requireAuth(['admin'])) return;
    this.setupModals();
    this.renderStats();
    this.renderUsers();
    this.renderActivity();
    this.renderModeration();
    this.drawBarChart();
  },

  async renderStats() {
    try {
      const response = await fetch('Admin.aspx/GetStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      const s = result.d;

      const stats = [
        { icon: '👥', bg: 'var(--accent-blue-light)', value: s.totalUsers, label: 'Total Users' },
        { icon: '📝', bg: 'var(--accent-green-light)', value: s.totalQuizzes, label: 'Total Quizzes' },
        { icon: '📦', bg: 'var(--accent-yellow-light)', value: s.contentItems, label: 'Content Items' },
        { icon: '⏳', bg: 'var(--accent-orange-light)', value: s.pendingReviews, label: 'Pending Review' },
      ];

    document.getElementById('admin-stats').innerHTML = stats.map(s => `
      <div class="admin-stat">
        <div class="admin-stat-icon" style="background:${s.bg}">${s.icon}</div>
        <div>
          <div class="admin-stat-value">${s.value}</div>
          <div class="admin-stat-label">${s.label}</div>
        </div>
      </div>
    `).join('');
    } catch(e) { console.error('Failed to load stats', e); }
  },

  async renderUsers() {
    try {
      const response = await fetch('Admin.aspx/GetUsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      const users = result.d;
      const container = document.getElementById('user-list');

      if (!users.length) {
        container.innerHTML = '<p style="color:var(--text-tertiary);padding:var(--space-md)">No users registered yet.</p>';
        return;
      }

      container.innerHTML = users.map(u => `
        <div class="user-row" style="display:flex;align-items:center;gap:var(--space-sm)">
          <div class="avatar avatar-sm">${u.avatar || '👤'}</div>
          <span class="user-name" style="flex:1">${u.name}</span>
          <span class="badge badge-${u.role === 'admin' ? 'red' : u.role === 'instructor' ? 'purple' : u.role === 'parent' ? 'blue' : 'green'}">${u.role}</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="Admin.editUser(${u.id}, '${u.name}', '${u.role}')">✏️</button>
          <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin.deleteUser(${u.id})">🗑️</button>
        </div>
      `).join('');
    } catch(e) { console.error('Failed to load users', e); }
  },

  async renderActivity() {
    try {
      const response = await fetch('Admin.aspx/GetActivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      const activity = result.d;
      const container = document.getElementById('activity-feed');
      container.innerHTML = activity.map(a => `
        <div class="activity-item">
          <span class="activity-text"><strong>${a.user}</strong> ${a.action} <em>${a.target}</em></span>
          <span class="activity-time">${a.time}</span>
        </div>
      `).join('');
    } catch(e) { console.error('Failed to load activity', e); }
  },

  async renderModeration() {
    const container = document.getElementById('moderation-list');
    try {
      const response = await fetch('Admin.aspx/GetContentItems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      const items = result.d || [];
      const pending = items.filter(i => i.status === 'pending');
      const recent = items.slice(0, 8);

      if (!recent.length) {
        container.innerHTML = '<p style="color:var(--text-tertiary);padding:var(--space-md);font-size:var(--text-sm)">No content items yet.</p>';
        return;
      }

      container.innerHTML = recent.map(item => `
        <div class="user-row" style="display:flex;align-items:center;gap:var(--space-sm);padding:var(--space-sm) 0;border-bottom:1px solid var(--border-color)">
          <span style="flex:1;font-size:var(--text-sm)">
            <strong>${item.label}</strong>
            <span style="color:var(--text-tertiary)"> · ${item.formulaName} · ${item.questionCount}q</span>
          </span>
          <span class="badge badge-${item.status === 'approved' ? 'green' : item.status === 'pending' ? 'yellow' : 'red'}" style="font-size:var(--text-xs)">${item.status}</span>
          ${item.status === 'pending' ? `
            <button type="button" class="btn btn-ghost btn-sm" style="color:var(--accent-green);padding:0 4px" onclick="Admin.approveContent('${item.id}')" title="Approve">✓</button>
            <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);padding:0 4px" onclick="Admin.rejectContent('${item.id}')" title="Reject">✗</button>
          ` : ''}
        </div>
      `).join('');
    } catch(e) {
      console.error('Failed to load moderation items', e);
      container.innerHTML = '<p style="color:var(--text-tertiary);padding:var(--space-md);font-size:var(--text-sm)">Failed to load content.</p>';
    }
  },

  async approveContent(id) {
    try {
      const res = await fetch('Admin.aspx/ApproveContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: id })
      });
      const data = await res.json();
      if (data.d === 'success') {
        App.showToast('Content approved! ✅', 'success');
        this.renderModeration();
        this.renderStats();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch(e) {
      console.error(e);
      App.showToast('Error approving content', 'error');
    }
  },

  async rejectContent(id) {
    const reason = prompt('Reason for rejection:');
    if (reason === null || !reason.trim()) return;
    try {
      const res = await fetch('Admin.aspx/RejectContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: id, reason: reason.trim() })
      });
      const data = await res.json();
      if (data.d === 'success') {
        App.showToast('Content rejected ❌', 'error');
        this.renderModeration();
        this.renderStats();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch(e) {
      console.error(e);
      App.showToast('Error rejecting content', 'error');
    }
  },

  drawBarChart() {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '200px';
    ctx.scale(dpr, dpr);

    const w = rect.width, h = 200;

    /*
     * BACKEND TODO:
     * Replace with: const weeklyData = await fetch('/api/admin/analytics/weekly').then(r => r.json());
     * Server should return { labels: ['Mon','Tue',...], values: [12, 19, ...] }
     */

    // Show placeholder message when no backend data
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#9A9A9A';
    ctx.font = '13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Weekly activity chart — connect backend for live data', w / 2, h / 2);

    // Draw sample bar structure (light placeholder)
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const pad = { top: 10, right: 10, bottom: 30, left: 10 };
    const cw = w - pad.left - pad.right;
    const gap = cw / labels.length;
    const barW = gap * 0.6;

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.08)';
    labels.forEach((label, i) => {
      const x = pad.left + gap * i + gap / 2 - barW / 2;
      const barH = 20 + Math.random() * 40;
      const y = h - pad.bottom - barH;

      ctx.beginPath();
      const radius = 6;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barW - radius, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
      ctx.lineTo(x + barW, h - pad.bottom);
      ctx.lineTo(x, h - pad.bottom);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#9A9A9A';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, pad.left + gap * i + gap / 2, h - 8);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.08)';
    });
  },

  setupModals() {
    const modalHtml = `
      <div class="modal-overlay" id="edit-user-modal">
        <div class="modal" style="max-width: 400px; padding: var(--space-xl)">
          <h2 style="margin-bottom: var(--space-md)">Edit User Profile</h2>
          <input type="hidden" id="edit-user-id" />
          <div class="form-group">
            <label class="form-label" for="edit-user-name">Name</label>
            <input type="text" id="edit-user-name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-user-role">Role</label>
            <select id="edit-user-role" class="form-input">
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md)">
            <button type="button" class="btn btn-primary" onclick="Admin.saveUser()" style="flex:1">Save Changes</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('edit-user-modal').classList.remove('active')" style="flex:1">Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  editUser(id, name, role) {
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-user-name').value = name;
    document.getElementById('edit-user-role').value = role;
    document.getElementById('edit-user-modal').classList.add('active');
  },

  async saveUser() {
    const id = document.getElementById('edit-user-id').value;
    const name = document.getElementById('edit-user-name').value.trim();
    const role = document.getElementById('edit-user-role').value;

    if (!name) return App.showToast('Name is required', 'error');

    try {
      const response = await fetch('Admin.aspx/UpdateUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: parseInt(id), name, role })
      });
      const data = await response.json();
      if (data.d === 'success') {
        App.showToast('User updated successfully', 'success');
        document.getElementById('edit-user-modal').classList.remove('active');
        this.renderUsers();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error updating user', 'error');
    }
  },

  async deleteUser(id) {
    if (!confirm('Are you sure you want to permanently delete this user? ALL of their activity (posts, submissions, quiz results) will be erased!')) return;
    try {
      const response = await fetch('Admin.aspx/DeleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: parseInt(id) })
      });
      const data = await response.json();
      if (data.d === 'success') {
        App.showToast('User deleted successfully', 'success');
        this.renderUsers();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error deleting user', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
