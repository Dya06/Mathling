/* ============================================
   MATHLINGS — Forum Page Logic
   ============================================ */

/*
 * BACKEND TODO:
 * Forum operations should use these API endpoints:
 *
 *   GET    /api/forum/threads                     → list all threads (with pagination)
 *   GET    /api/forum/threads?category=Tips       → filter by category
 *   GET    /api/forum/threads/:id                 → single thread with replies
 *   POST   /api/forum/threads                     → create new thread
 *          Body: { title, content, category }
 *   POST   /api/forum/threads/:id/replies         → add reply
 *          Body: { content }
 *   PUT    /api/forum/threads/:id                 → edit thread (author/admin only)
 *   DELETE /api/forum/threads/:id                 → delete thread (author/admin only)
 *   DELETE /api/forum/replies/:id                 → delete reply (author/admin only)
 *
 * Server should:
 *   - Validate that the user is authenticated
 *   - Sanitize HTML/markdown to prevent XSS
 *   - Implement pagination (e.g., 20 threads per page)
 *   - Support search functionality
 *   - Send email notifications for replies (optional)
 *   - Implement rate limiting to prevent spam
 */

const Forum = {
  currentThread: null,
  currentFilter: 'all',

  init() {
    if (!App.requireAuth()) return;
    this.renderThreads();
    this.setupFilters();
    this.setupNewThread();
  },

  getThreads() {
    /*
     * BACKEND TODO:
     * Replace with: return await fetch('/api/forum/threads').then(r => r.json());
     */
    return JSON.parse(localStorage.getItem('mathlings-forum') || '[]');
  },

  renderThreads() {
    const threads = this.getThreads().filter(t => 
      this.currentFilter === 'all' || t.category === this.currentFilter
    );
    const list = document.getElementById('thread-list');
    const detail = document.getElementById('thread-detail');
    if (!list) return;

    if (this.currentThread) { this.renderDetail(); return; }
    detail.style.display = 'none';
    list.style.display = 'flex';

    list.innerHTML = threads.length ? threads.map(t => `
      <div class="thread-card" onclick="Forum.openThread(${t.id})">
        <div class="thread-card-header">
          <div class="avatar avatar-sm">${t.role === 'instructor' ? '👨‍🏫' : '👩'}</div>
          <h3>${t.title}</h3>
          <span class="badge badge-${t.category === 'Tips' ? 'green' : t.category === 'Questions' ? 'blue' : 'yellow'}">${t.category}</span>
        </div>
        <div class="thread-card-meta">
          <span>👤 ${t.author}</span>
          <span>💬 ${t.replies} replies</span>
          <span>📅 ${t.date}</span>
        </div>
      </div>
    `).join('') : '<div class="empty-state"><h3>No threads yet</h3><p>Start the conversation!</p></div>';
  },

  openThread(id) {
    /*
     * BACKEND TODO:
     * Replace with: this.currentThread = await fetch(`/api/forum/threads/${id}`).then(r => r.json());
     */
    this.currentThread = this.getThreads().find(t => t.id === id);
    this.renderDetail();
  },

  renderDetail() {
    const t = this.currentThread;
    if (!t) return;
    document.getElementById('thread-list').style.display = 'none';
    const detail = document.getElementById('thread-detail');
    detail.style.display = 'block';
    detail.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="Forum.currentThread=null;Forum.renderThreads()" style="margin-bottom:var(--space-md)">← Back to threads</button>
      <div class="thread-detail-header">
        <h2>${t.title}</h2>
        <div style="display:flex;align-items:center;gap:var(--space-sm);font-size:var(--text-sm);color:var(--text-tertiary)">
          <span class="badge badge-blue">${t.role}</span> ${t.author} • ${t.date}
        </div>
      </div>
      <div class="thread-body">
        <p>${t.content}</p>
      </div>
      <h4 style="margin-bottom:var(--space-md)">💬 Replies (${(t.replyList || []).length})</h4>
      <div class="reply-list">
        ${(t.replyList || []).map(r => `
          <div class="reply-card">
            <div class="reply-header">
              <div class="avatar avatar-sm">${r.role === 'instructor' ? '👨‍🏫' : '👩'}</div>
              <strong>${r.author}</strong>
              <span class="badge badge-${r.role === 'instructor' ? 'purple' : 'blue'} btn-sm" style="padding:2px 8px">${r.role}</span>
              <span style="margin-left:auto;font-size:var(--text-xs);color:var(--text-tertiary)">${r.date}</span>
            </div>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">${r.content}</p>
          </div>
        `).join('') || '<p style="color:var(--text-tertiary);padding:var(--space-md)">No replies yet. Be the first to respond!</p>'}
      </div>
      <div class="reply-form">
        <h4>Reply</h4>
        <textarea class="form-input" id="reply-text" placeholder="Write your reply..." rows="3"></textarea>
        <button class="btn btn-accent-blue btn-sm" style="margin-top:var(--space-sm)" onclick="Forum.addReply()">Post Reply</button>
      </div>
    `;
  },

  addReply() {
    const text = document.getElementById('reply-text')?.value.trim();
    if (!text) { App.showToast('Please write a reply', 'error'); return; }

    /*
     * BACKEND TODO:
     * Replace with:
     *   await fetch(`/api/forum/threads/${this.currentThread.id}/replies`, {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({ content: text })
     *   });
     *   // Then refresh thread data from server
     *   this.openThread(this.currentThread.id);
     */
    const threads = this.getThreads();
    const t = threads.find(t => t.id === this.currentThread.id);
    if (!t.replyList) t.replyList = [];
    t.replyList.push({
      author: App.state.currentUser.name,
      role: App.state.currentUser.role,
      content: text,
      date: new Date().toISOString().split('T')[0],
    });
    t.replies = t.replyList.length;
    localStorage.setItem('mathlings-forum', JSON.stringify(threads));
    this.currentThread = t;
    this.renderDetail();
    App.showToast('Reply posted! 💬', 'success');
  },

  setupFilters() {
    document.querySelectorAll('.forum-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.forum-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.currentThread = null;
        this.renderThreads();
      });
    });
  },

  setupNewThread() {
    document.getElementById('new-thread-btn')?.addEventListener('click', () => {
      document.getElementById('new-thread-form').classList.toggle('active');
    });
    document.getElementById('submit-thread')?.addEventListener('click', () => {
      const title = document.getElementById('thread-title').value.trim();
      const content = document.getElementById('thread-content').value.trim();
      const category = document.getElementById('thread-category').value;
      if (!title || !content) { App.showToast('Please fill in all fields', 'error'); return; }

      /*
       * BACKEND TODO:
       * Replace with:
       *   await fetch('/api/forum/threads', {
       *     method: 'POST',
       *     headers: { 'Content-Type': 'application/json' },
       *     body: JSON.stringify({ title, content, category })
       *   });
       *   // Then refresh thread list from server
       */
      const threads = this.getThreads();
      threads.unshift({
        id: Date.now(), title, content, category,
        author: App.state.currentUser.name,
        role: App.state.currentUser.role,
        replies: 0, date: new Date().toISOString().split('T')[0],
        replyList: [],
      });
      localStorage.setItem('mathlings-forum', JSON.stringify(threads));
      document.getElementById('new-thread-form').classList.remove('active');
      document.getElementById('thread-title').value = '';
      document.getElementById('thread-content').value = '';
      this.renderThreads();
      App.showToast('Thread created! 🎉', 'success');
    });
  },
};

document.addEventListener('DOMContentLoaded', () => Forum.init());
