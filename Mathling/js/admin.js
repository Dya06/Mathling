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
    this.renderStats();
    this.renderUsers();
    this.renderActivity();
    this.renderFeedback();
    this.drawBarChart();
  },

  renderStats() {
    /*
     * BACKEND TODO:
     * Replace with: const stats = await fetch('/api/admin/stats').then(r => r.json());
     */
    const users = JSON.parse(localStorage.getItem('mathlings-users') || '[]');
    const subs = JSON.parse(localStorage.getItem('mathlings-submissions') || '[]');
    const history = JSON.parse(localStorage.getItem('mathlings-quiz-history') || '[]');

    const stats = [
      { icon: '👥', bg: 'var(--accent-blue-light)', value: users.length, label: 'Total Users' },
      { icon: '📝', bg: 'var(--accent-green-light)', value: history.length, label: 'Total Quizzes' },
      { icon: '📦', bg: 'var(--accent-yellow-light)', value: subs.length, label: 'Content Items' },
      { icon: '⏳', bg: 'var(--accent-orange-light)', value: subs.filter(s => s.status === 'pending').length, label: 'Pending Review' },
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
  },

  renderUsers() {
    /*
     * BACKEND TODO:
     * Replace with: const users = await fetch('/api/admin/users').then(r => r.json());
     * Should support pagination, search, and role filtering.
     * Each user row should have actions: edit, disable, delete.
     */
    const users = JSON.parse(localStorage.getItem('mathlings-users') || '[]');
    const container = document.getElementById('user-list');

    if (!users.length) {
      container.innerHTML = '<p style="color:var(--text-tertiary);padding:var(--space-md)">No users registered yet.</p>';
      return;
    }

    container.innerHTML = users.map(u => `
      <div class="user-row">
        <div class="avatar avatar-sm">${u.avatar || '👤'}</div>
        <span class="user-name">${u.name}</span>
        <span class="badge badge-${u.role === 'admin' ? 'red' : u.role === 'instructor' ? 'purple' : u.role === 'parent' ? 'blue' : 'green'}">${u.role}</span>
      </div>
    `).join('');
  },

  renderActivity() {
    /*
     * BACKEND TODO:
     * Replace with: const activity = await fetch('/api/admin/activity').then(r => r.json());
     * Server should track and return recent platform events:
     *   - User registrations
     *   - Quiz completions
     *   - Content submissions
     *   - Forum posts
     *   - Login events
     * Each event: { text, timestamp, type }
     */
    const container = document.getElementById('activity-feed');
    container.innerHTML = '<p style="color:var(--text-tertiary);padding:var(--space-md);font-size:var(--text-sm)">Activity feed will appear here once connected to the backend.</p>';
  },

  renderFeedback() {
    /*
     * BACKEND TODO:
     * Replace with: const feedback = await fetch('/api/admin/feedback').then(r => r.json());
     * Users should be able to submit feedback via a form on any page.
     * Each feedback item: { text, author, priority, date, status }
     * Admin can mark feedback as resolved.
     */
    const container = document.getElementById('feedback-list');
    container.innerHTML = '<p style="color:var(--text-tertiary);padding:var(--space-md);font-size:var(--text-sm)">No feedback submitted yet.</p>';
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
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
