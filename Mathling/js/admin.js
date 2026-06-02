/* ============================================
   MATHLINGS — Admin Dashboard Logic
   ============================================ */

/*
 * BACKEND TODO:
 * Admin dashboard data should come from these endpoints:
 *
 *   GET /api/admin/stats           -> { totalUsers, totalQuizzes, contentItems, pendingReviews }
 *   GET /api/admin/users           -> paginated user list with search/filter
 *   GET /api/admin/users?role=X    -> filter users by role
 *   GET /api/admin/activity        -> recent platform activity feed
 *   GET /api/admin/feedback        -> user feedback/reports list
 *   GET /api/admin/analytics/weekly -> chart data for weekly activity
 *   PUT /api/admin/users/:id       -> update user (enable/disable, change role)
 *   DELETE /api/admin/users/:id    -> delete user account
 *   GET /api/admin/reports/export?format=csv -> export reports
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
  },

  async renderStats() {
    try {
      const response = await fetch('Admin.aspx/GetStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      const s = result.d;

      const stats = [
        { icon: '', bg: 'var(--accent-blue-light)', value: s.totalUsers, label: 'Total Users' },
        { icon: '', bg: 'var(--accent-green-light)', value: s.totalQuizzes, label: 'Total Quizzes' },
        { icon: '', bg: 'var(--accent-yellow-light)', value: s.contentItems, label: 'Content Items' },
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
    } catch(e) { 
      console.error('Failed to load stats', e); 
      App.showToast('Stats error: ' + (e.message || e), 'error');
    }
  },

  async renderUsers() {
    try {
      const response = await fetch('Admin.aspx/GetUsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
          <div class="avatar avatar-sm">${u.avatar || ''}</div>
          <span class="user-name" style="flex:1">${u.name}</span>
          <span class="badge badge-${u.role === 'admin' ? 'red' : u.role === 'instructor' ? 'purple' : u.role === 'parent' ? 'blue' : 'green'}">${u.role}</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="Admin.editUser(${u.id}, '${u.name}', '${u.role}')">Edit</button>
          <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="Admin.deleteUser(${u.id})">Delete</button>
        </div>
      `).join('');
    } catch(e) { 
      console.error('Failed to load users', e); 
      App.showToast('Users error: ' + (e.message || e), 'error');
    }
  },

  async renderActivity() {
    try {
      const response = await fetch('Admin.aspx/GetActivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
    } catch(e) { 
      console.error('Failed to load activity', e);
      App.showToast('Activity error: ' + (e.message || e), 'error');
    }
  },

  async renderModeration() {
    const container = document.getElementById('moderation-list');
    try {
      const response = await fetch('Admin.aspx/GetContentItems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
            <button type="button" class="btn btn-ghost btn-sm" style="color:var(--accent-green);padding:0 4px" onclick="Admin.approveContent('${item.id}')" title="Approve">Approve</button>
            <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);padding:0 4px" onclick="Admin.rejectContent('${item.id}')" title="Reject">Reject</button>
          ` : ''}
        </div>
      `).join('');
    } catch(e) {
      App.showToast('Moderation error: ' + (e.message || e), 'error');
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
        App.showToast('Content approved! ', 'success');
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
        App.showToast('Content rejected ', 'error');
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

      <div class="modal-overlay" id="add-user-modal">
        <div class="modal" style="max-width: 400px; padding: var(--space-xl)">
          <h2 style="margin-bottom: var(--space-md)">Add New User</h2>
          <div class="form-group">
            <label class="form-label" for="add-user-name">Name</label>
            <input type="text" id="add-user-name" class="form-input" placeholder="Full name"/>
          </div>
          <div class="form-group">
            <label class="form-label" for="add-user-email">Email</label>
            <input type="email" id="add-user-email" class="form-input" placeholder="Email address" />
          </div>
          <div class="form-group">
            <label class="form-label" for="add-user-password">Password</label>
            <input type="password" id="add-user-password" class="form-input" placeholder="Temporary password" />
          </div>
          <div class="form-group">
            <label class="form-label" for="add-user-role">Role</label>
            <select id="add-user-role" class="form-input">
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md)">
            <button type="button" class="btn btn-primary" onclick="Admin.submitAddUser()" style="flex:1">Create User</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('add-user-modal').classList.remove('active')" style="flex:1">Cancel</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  showAddUserModal() {
    document.getElementById('add-user-name').value = '';
    document.getElementById('add-user-email').value = '';
    document.getElementById('add-user-password').value = '';
    document.getElementById('add-user-role').value = 'student';
    document.getElementById('add-user-modal').classList.add('active');
  },

  async submitAddUser() {
    const name = document.getElementById('add-user-name').value.trim();
    const email = document.getElementById('add-user-email').value.trim();
    const password = document.getElementById('add-user-password').value.trim();
    const role = document.getElementById('add-user-role').value;

    if (!name || !email || !password) {
      return App.showToast('Please fill in all fields', 'error');
    }

    try {
      const response = await fetch('Admin.aspx/AddUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (data.d === 'success') {
        App.showToast('User created successfully!', 'success');
        document.getElementById('add-user-modal').classList.remove('active');
        this.renderUsers();
        this.renderStats();
      } else {
        App.showToast(data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error creating user', 'error');
    }
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

