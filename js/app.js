/* ============================================
   MATHLINGS — Global App Logic
   Dark mode, navigation, shared utilities
   ============================================ */

/*
 * BACKEND TODO:
 * - Replace localStorage-based auth with proper session/JWT authentication
 * - All API calls should go through a centralized fetch wrapper (see api.js placeholder below)
 * - User state should be fetched from server on page load, not read from localStorage
 * - Implement proper RBAC (role-based access control) on the server side
 *
 * Suggested API structure:
 *   POST   /api/auth/login
 *   POST   /api/auth/register
 *   POST   /api/auth/logout
 *   GET    /api/auth/me           (returns current session user)
 *   GET    /api/users             (admin only)
 *   GET    /api/users/:id
 *   PUT    /api/users/:id
 *   DELETE /api/users/:id         (admin only)
 *   GET    /api/chapters
 *   GET    /api/chapters/:id/questions
 *   POST   /api/quiz/submit       (submit quiz answers)
 *   GET    /api/progress/:userId
 *   GET    /api/badges/:userId
 *   GET    /api/forum/threads
 *   POST   /api/forum/threads
 *   GET    /api/forum/threads/:id
 *   POST   /api/forum/threads/:id/replies
 *   GET    /api/submissions       (moderation queue)
 *   POST   /api/submissions
 *   PUT    /api/submissions/:id   (approve/reject)
 *   GET    /api/admin/stats
 *   GET    /api/admin/activity
 *   GET    /api/admin/feedback
 */

const App = {
  // ---- State ----
  state: {
    theme: localStorage.getItem('mathlings-theme') || 'light',
    audioEnabled: localStorage.getItem('mathlings-audio') === 'true',
    /*
     * BACKEND TODO:
     * Replace this with a call to GET /api/auth/me on page load.
     * The server should validate the session cookie/JWT and return the user object.
     * If not authenticated, currentUser should be null.
     */
    currentUser: JSON.parse(localStorage.getItem('mathlings-user') || 'null'),
  },

  // ---- Initialize ----
  init() {
    this.applyTheme();
    this.setupNav();
    this.setupThemeToggle();
    this.setupAudioToggle();
    this.renderNav();
    this.setupMobileMenu();
    document.body.classList.add('loaded');
  },

  // ---- Theme ----
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.state.theme);
  },

  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('mathlings-theme', this.state.theme);
    this.applyTheme();
    this.updateThemeIcon();
  },

  setupThemeToggle() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle');
      if (btn) this.toggleTheme();
    });
    this.updateThemeIcon();
  },

  updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = this.state.theme === 'dark';
    btn.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  },

  // ---- Audio / TTS ----
  setupAudioToggle() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#audio-toggle');
      if (btn) {
        this.state.audioEnabled = !this.state.audioEnabled;
        localStorage.setItem('mathlings-audio', this.state.audioEnabled);
        btn.classList.toggle('active', this.state.audioEnabled);
        this.showToast(this.state.audioEnabled ? 'Audio enabled 🔊' : 'Audio disabled 🔇', 'info');
      }
    });
  },

  speak(text) {
    if (!this.state.audioEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    utter.pitch = 1.1;
    window.speechSynthesis.speak(utter);
  },

  // ---- Navigation ----
  getNavItems() {
    const role = this.state.currentUser?.role;
    const base = [{ label: 'Home', href: 'index.html', icon: 'home' }];
    
    /*
     * BACKEND TODO:
     * Navigation items could be returned by the server based on the user's role
     * and permissions, allowing dynamic menu configuration from the admin panel.
     */
    const roleNav = {
      student: [
        { label: 'Learn', href: 'quiz.html', icon: 'book' },
        { label: 'Progress', href: 'progress.html', icon: 'chart' },
        { label: 'Profile', href: 'profile.html', icon: 'user' },
      ],
      parent: [
        { label: 'Progress', href: 'progress.html', icon: 'chart' },
        { label: 'Forum', href: 'forum.html', icon: 'forum' },
        { label: 'Profile', href: 'profile.html', icon: 'user' },
      ],
      instructor: [
        { label: 'Forum', href: 'forum.html', icon: 'forum' },
        { label: 'Moderate', href: 'moderate.html', icon: 'shield' },
        { label: 'Profile', href: 'profile.html', icon: 'user' },
      ],
      admin: [
        { label: 'Dashboard', href: 'admin.html', icon: 'dashboard' },
        { label: 'Moderate', href: 'moderate.html', icon: 'shield' },
        { label: 'Progress', href: 'progress.html', icon: 'chart' },
        { label: 'Profile', href: 'profile.html', icon: 'user' },
      ],
    };

    return [...base, ...(roleNav[role] || [])];
  },

  getIcon(name) {
    const icons = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      forum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
      logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
      login: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
    };
    return icons[name] || '';
  },

  renderNav() {
    const nav = document.getElementById('main-nav');
    const mobileNav = document.getElementById('mobile-nav');
    if (!nav) return;

    const items = this.getNavItems();
    const current = window.location.pathname.split('/').pop() || 'index.html';

    let html = items.map(item => 
      `<a href="${item.href}" class="nav-link ${current === item.href ? 'active' : ''}">${this.getIcon(item.icon)}<span>${item.label}</span></a>`
    ).join('');

    nav.innerHTML = html;

    if (mobileNav) {
      let mobileHtml = items.map(item =>
        `<a href="${item.href}" class="nav-link ${current === item.href ? 'active' : ''}">${this.getIcon(item.icon)}<span>${item.label}</span></a>`
      ).join('');

      if (this.state.currentUser) {
        mobileHtml += `<a href="#" class="nav-link" onclick="App.logout(); return false;">${this.getIcon('logout')}<span>Logout</span></a>`;
      } else {
        mobileHtml += `<a href="login.html" class="nav-link">${this.getIcon('login')}<span>Login</span></a>`;
      }
      mobileNav.innerHTML = mobileHtml;
    }
  },

  setupNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === current) link.classList.add('active');
    });
  },

  setupMobileMenu() {
    document.addEventListener('click', (e) => {
      const hamburger = e.target.closest('#hamburger');
      if (hamburger) {
        hamburger.classList.toggle('active');
        document.getElementById('mobile-nav')?.classList.toggle('active');
      }
    });
  },

  // ---- Auth ----
  /*
   * BACKEND TODO:
   * login() should POST credentials to /api/auth/login and receive a session token.
   * The token should be stored as an httpOnly cookie (server-side) for security.
   * On success, the server returns the user object which we store in state.
   */
  login(user) {
    this.state.currentUser = user;
    localStorage.setItem('mathlings-user', JSON.stringify(user));
    this.renderNav();
  },

  /*
   * BACKEND TODO:
   * logout() should POST to /api/auth/logout to invalidate the session on the server.
   */
  logout() {
    this.state.currentUser = null;
    localStorage.removeItem('mathlings-user');
    window.location.href = 'index.html';
  },

  /*
   * BACKEND TODO:
   * requireAuth() should verify the session with the server via GET /api/auth/me.
   * Server-side middleware should also enforce role-based access on protected API routes.
   */
  requireAuth(allowedRoles = []) {
    if (!this.state.currentUser) {
      window.location.href = 'login.html';
      return false;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(this.state.currentUser.role)) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  // ---- Toast Notifications ----
  showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  // ---- Confetti Effect ----
  confetti() {
    const colors = ['#FFD43B', '#FF6B6B', '#4DABF7', '#51CF66', '#B197FC', '#FF922B'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.style.cssText = `
        position:absolute;
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}%;
        top:-20px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confetti-fall ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards;
      `;
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4000);
  },

  // ---- Animate counter ----
  animateCounter(el, target, duration = 1500) {
    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  // ---- Intersection Observer for animations ----
  observeAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  },
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
