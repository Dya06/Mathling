/* ============================================
   MATHLINGS — Auth Logic
   ============================================ */

/*
 * BACKEND TODO:
 * This entire file needs to be connected to a real authentication backend.
 *
 * Login flow:
 *   1. POST /api/auth/login { email, password }
 *   2. Server validates credentials against the database (hashed passwords with bcrypt)
 *   3. Server creates a session or returns a JWT token
 *   4. On success: return user object { id, name, email, role, avatar, level, xp }
 *   5. On failure: return 401 with error message
 *
 * Registration flow:
 *   1. POST /api/auth/register { name, email, password, role }
 *   2. Server validates uniqueness of email
 *   3. Server hashes password, creates user record in database
 *   4. Server sends verification email (optional)
 *   5. On success: auto-login or redirect to login page
 *
 * Password security:
 *   - Use bcrypt for password hashing (min 10 salt rounds)
 *   - Enforce password strength requirements
 *   - Implement rate limiting on login attempts
 *   - Add forgot password / reset password flow
 *
 * Session management:
 *   - Use httpOnly secure cookies for session tokens
 *   - Implement token refresh mechanism
 *   - Add CSRF protection
 */

const Auth = {
  init() {
    const form = document.getElementById('auth-form');
    if (!form) return;
    
    this.seedDemoAccounts();
    this.setupTabs();
    this.setupForm();
    this.setupRoleSelector();
  },

  /*
   * BACKEND TODO: Remove this method entirely.
   * Demo accounts are only for frontend testing without a backend.
   * In production, users are created via the registration flow.
   */
  seedDemoAccounts() {
    const users = JSON.parse(localStorage.getItem('mathlings-users') || '[]');
    const demoAccounts = [
      { id: 1, name: 'Alex Student', email: 'student@demo.com', password: 'demo123', role: 'student', avatar: '🧒', level: 1, xp: 0 },
      { id: 2, name: 'Sarah Parent', email: 'parent@demo.com', password: 'demo123', role: 'parent', avatar: '👩', level: 1, xp: 0 },
      { id: 3, name: 'Robert Instructor', email: 'instructor@demo.com', password: 'demo123', role: 'instructor', avatar: '👨‍🏫', level: 1, xp: 0 },
      { id: 4, name: 'Admin User', email: 'admin@demo.com', password: 'demo123', role: 'admin', avatar: '🛡️', level: 1, xp: 0 },
    ];
    demoAccounts.forEach(demo => {
      if (!users.find(u => u.email === demo.email)) users.push(demo);
    });
    localStorage.setItem('mathlings-users', JSON.stringify(users));
  },

  setupTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
        document.getElementById('register-form').style.display = mode === 'register' ? 'block' : 'none';
        document.getElementById('auth-title').textContent = mode === 'login' ? 'Welcome Back!' : 'Join Mathlings!';
        document.getElementById('auth-subtitle').textContent = mode === 'login' 
          ? 'Log in to continue your learning adventure' 
          : 'Create your account and start learning';
      });
    });
  },

  setupRoleSelector() {
    document.querySelectorAll('.role-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('selected-role').value = option.dataset.role;
      });
    });
  },

  setupForm() {
    // Login
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      /*
       * BACKEND TODO:
       * Replace this block with:
       *   const response = await fetch('/api/auth/login', {
       *     method: 'POST',
       *     headers: { 'Content-Type': 'application/json' },
       *     body: JSON.stringify({ email, password })
       *   });
       *   if (response.ok) {
       *     const user = await response.json();
       *     App.login(user);
       *     // redirect based on role
       *   } else {
       *     const error = await response.json();
       *     this.showError('login-email', error.message);
       *   }
       *
       * Currently using localStorage simulation for frontend demo:
       */
      const users = JSON.parse(localStorage.getItem('mathlings-users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        App.login(user);
        App.showToast(`Welcome back, ${user.name}! 🎉`, 'success');
        setTimeout(() => {
          const dest = { student: 'quiz.html', parent: 'progress.html', instructor: 'forum.html', admin: 'admin.html' };
          window.location.href = dest[user.role] || 'index.html';
        }, 800);
      } else {
        this.showError('login-email', 'Invalid email or password');
        App.showToast('Invalid credentials', 'error');
      }
    });

    // Register
    document.getElementById('register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const role = document.getElementById('selected-role').value;

      if (!name || !email || !password) {
        App.showToast('Please fill in all fields', 'error');
        return;
      }
      if (!role) {
        App.showToast('Please select a role', 'error');
        return;
      }

      /*
       * BACKEND TODO:
       * Replace this block with:
       *   const response = await fetch('/api/auth/register', {
       *     method: 'POST',
       *     headers: { 'Content-Type': 'application/json' },
       *     body: JSON.stringify({ name, email, password, role })
       *   });
       *   if (response.ok) {
       *     const user = await response.json();
       *     App.login(user);
       *     // redirect based on role
       *   } else {
       *     const error = await response.json();
       *     this.showError('reg-email', error.message);
       *   }
       *
       * Server should also:
       *   - Validate email format and uniqueness
       *   - Hash the password before storing
       *   - Create default profile data (level 1, 0 XP, etc.)
       *   - Optionally send a welcome/verification email
       */
      const users = JSON.parse(localStorage.getItem('mathlings-users') || '[]');
      if (users.find(u => u.email === email)) {
        this.showError('reg-email', 'Email already registered');
        return;
      }

      const avatars = { student: '🧒', parent: '👩', instructor: '👨‍🏫', admin: '🛡️' };
      const newUser = {
        id: users.length + 1,
        name, email, password, role,
        level: 1, xp: 0,
        avatar: avatars[role],
      };

      users.push(newUser);
      localStorage.setItem('mathlings-users', JSON.stringify(users));
      App.login(newUser);
      App.showToast(`Account created! Welcome, ${name}! 🎉`, 'success');
      App.confetti();
      
      setTimeout(() => {
        const dest = { student: 'quiz.html', parent: 'progress.html', instructor: 'forum.html', admin: 'admin.html' };
        window.location.href = dest[role] || 'index.html';
      }, 1500);
    });
  },

  showError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('form-input-error');
    let errorEl = input.parentElement.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    setTimeout(() => {
      input.classList.remove('form-input-error');
      errorEl?.remove();
    }, 3000);
  },
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
