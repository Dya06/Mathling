/* ============================================
   MATHLINGS — Progress Page with Canvas Charts
   ============================================ */

/*
 * BACKEND TODO:
 * All progress data should be fetched from the server:
 *
 *   GET /api/progress/:userId              → quiz history, stats summary
 *   GET /api/progress/:userId/chart-data   → time-series data for charts
 *   GET /api/chapters                      → chapter completion data
 *
 * For parent role:
 *   GET /api/progress/children/:parentId   → aggregated stats for linked students
 *
 * For admin role:
 *   GET /api/admin/progress/overview       → platform-wide analytics
 *   GET /api/admin/progress/class/:classId → class-level stats
 *
 * Data export:
 *   GET /api/progress/:userId/export?format=csv  → downloadable report
 */

const Progress = {
  init() {
    if (!App.requireAuth()) return;
    this.renderStats();
    this.drawLineChart();
    this.drawDonutChart();
    this.renderHistory();
  },

  renderStats() {
    /*
     * BACKEND TODO:
     * Replace with: const stats = await fetch(`/api/progress/${userId}`).then(r => r.json());
     */
    const history = JSON.parse(localStorage.getItem('mathlings-quiz-history') || '[]');
    const chapters = JSON.parse(localStorage.getItem('mathlings-chapters') || '[]');
    const avg = history.length ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length) : 0;
    const best = history.length ? Math.max(...history.map(h => h.score)) : 0;
    const completed = chapters.filter(c => c.completed).length;
    
    const vals = [
      { icon: '📝', value: history.length, label: 'Quizzes Taken' },
      { icon: '🎯', value: avg + '%', label: 'Avg Score' },
      { icon: '🏆', value: best + '%', label: 'Best Score' },
      { icon: '📖', value: `${completed}/${chapters.length || 0}`, label: 'Chapters Done' },
    ];

    document.getElementById('stats-row').innerHTML = vals.map(v => `
      <div class="stat-box">
        <div class="stat-icon">${v.icon}</div>
        <div class="stat-num">${v.value}</div>
        <div class="stat-lbl">${v.label}</div>
      </div>
    `).join('');
  },

  drawLineChart() {
    const canvas = document.getElementById('line-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 250 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '250px';
    ctx.scale(dpr, dpr);

    const w = rect.width, h = 250;

    /*
     * BACKEND TODO:
     * Replace with: const chartData = await fetch(`/api/progress/${userId}/chart-data`).then(r => r.json());
     * Server should return { labels: [...], scores: [...] }
     */
    const history = JSON.parse(localStorage.getItem('mathlings-quiz-history') || '[]');
    const data = history.length ? history.map(h => h.score) : [];
    const labels = history.length ? history.map(h => h.date.slice(5)) : [];

    if (!data.length) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#9A9A9A';
      ctx.font = '14px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No quiz data yet — take a quiz to see your chart!', w / 2, h / 2);
      return;
    }

    const pad = { top: 20, right: 20, bottom: 40, left: 45 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Grid
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#9A9A9A';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(100 - (100 / 4) * i) + '%', pad.left - 8, y + 4);
    }

    // Labels
    ctx.textAlign = 'center';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#9A9A9A';
    data.forEach((_, i) => {
      const x = pad.left + (cw / (data.length - 1 || 1)) * i;
      ctx.fillText(labels[i] || '', x, h - 10);
    });

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    grad.addColorStop(0, 'rgba(77, 171, 247, 0.2)');
    grad.addColorStop(1, 'rgba(77, 171, 247, 0)');
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (cw / (data.length - 1 || 1)) * i;
      const y = pad.top + ch - (v / 100) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + cw, h - pad.bottom);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#4DABF7';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = pad.left + (cw / (data.length - 1 || 1)) * i;
      const y = pad.top + ch - (v / 100) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    data.forEach((v, i) => {
      const x = pad.left + (cw / (data.length - 1 || 1)) * i;
      const y = pad.top + ch - (v / 100) * ch;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#4DABF7'; ctx.lineWidth = 3; ctx.stroke();
    });
  },

  drawDonutChart() {
    const canvas = document.getElementById('donut-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    /*
     * BACKEND TODO:
     * Replace with server data: const { completed, total } = await fetch(`/api/chapters/progress`).then(r => r.json());
     */
    const chapters = JSON.parse(localStorage.getItem('mathlings-chapters') || '[]');
    const completed = chapters.filter(c => c.completed).length;
    const total = chapters.length || 1;
    const pct = completed / total;
    const cx = size / 2, cy = size / 2, r = 80, lw = 16;

    // Background ring
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#F5F0EB';
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();

    // Progress ring
    if (pct > 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#51CF66'); grad.addColorStop(1, '#4DABF7');
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
    }

    document.getElementById('donut-value').textContent = Math.round(pct * 100) + '%';
  },

  renderHistory() {
    /*
     * BACKEND TODO:
     * Replace with: const history = await fetch(`/api/progress/${userId}/history`).then(r => r.json());
     */
    const history = JSON.parse(localStorage.getItem('mathlings-quiz-history') || '[]');
    const tbody = document.getElementById('history-body');
    if (!tbody) return;

    if (!history.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-tertiary);padding:var(--space-2xl)">No quiz history yet. Start learning to see your results here!</td></tr>';
      return;
    }

    tbody.innerHTML = history.slice().reverse().map(h => `
      <tr>
        <td>${h.date}</td>
        <td><strong>${h.chapter}</strong></td>
        <td><span class="badge ${h.score >= 80 ? 'badge-green' : h.score >= 50 ? 'badge-yellow' : 'badge-red'}">${h.score}%</span></td>
        <td>${h.time}</td>
        <td style="color:var(--accent-yellow)">${'⭐'.repeat(h.stars)}</td>
      </tr>
    `).join('');
  },
};

document.addEventListener('DOMContentLoaded', () => Progress.init());
