const Forum = {
  currentThread: null,
  currentFilter: 'all',
  threadsData: [],

  async init() {
    if (!App.requireAuth()) return;
    this.setupFilters();
    this.setupNewThread();
    await this.fetchThreads();
  },

  async fetchThreads() {
    try {
      const response = await fetch('Forum.aspx/GetThreads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: "{}"
      });
      const data = await response.json();
      this.threadsData = data.d || [];
      this.renderThreads();
    } catch (e) {
      console.error('Error fetching threads:', e);
      App.showToast('Failed to load threads', 'error');
    }
  },

  renderThreads() {
    const threads = this.threadsData.filter(t => 
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
          <div class="avatar avatar-sm">${this.getAvatarHtml(t.avatar)}</div>
          <h3>${t.title}</h3>
          <span class="badge badge-${t.category === 'Tips' ? 'green' : t.category === 'Questions' ? 'blue' : 'yellow'}">${t.category}</span>
        </div>
        <div class="thread-card-meta">
          <span>&#128100; ${t.author}</span>
          <span>&#128172; ${t.replies} replies</span>
          <span>&#128197; ${t.date}</span>
        </div>
      </div>
    `).join('') : '<div class="empty-state"><h3>No threads yet</h3><p>Start the conversation!</p></div>';
  },

  getAvatarHtml(avatarType) {
      if (avatarType === 'student') return '&#129490;'; // 🧒
      if (avatarType === 'parent') return '&#128105;'; // 👩
      if (avatarType === 'instructor') return '&#128104;&#8205;&#127979;'; // 👨‍🏫
      if (avatarType === 'admin') return '&#128737;&#65039;'; // 🛡️
      return '&#128100;'; // 👤 fallback
  },

  async openThread(id) {
    try {
      const response = await fetch('Forum.aspx/GetThread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: id })
      });
      const data = await response.json();
      this.currentThread = data.d;
      this.renderDetail();
    } catch (e) {
      console.error('Error opening thread:', e);
      App.showToast('Failed to load thread details', 'error');
    }
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
      <h4 style="margin-bottom:var(--space-md)">&#128172; Replies (${t.replies})</h4>
      <div class="reply-list">
        ${(t.replyList || []).map(r => `
          <div class="reply-card">
            <div class="reply-header">
              <div class="avatar avatar-sm">${this.getAvatarHtml(r.avatar)}</div>
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

  async addReply() {
    const text = document.getElementById('reply-text')?.value.trim();
    if (!text) { App.showToast('Please write a reply', 'error'); return; }

    try {
      const response = await fetch('Forum.aspx/AddReply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: this.currentThread.id, content: text })
      });
      const data = await response.json();
      
      if (data.d === 'success') {
          App.showToast('Reply posted!', 'success');
          // Refresh thread to show new reply
          await this.openThread(this.currentThread.id);
          // Also fetch threads in background to update reply count in list
          this.fetchThreads();
      } else {
          App.showToast('Failed to post reply: ' + data.d, 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Error posting reply', 'error');
    }
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
    document.getElementById('submit-thread')?.addEventListener('click', async () => {
      const title = document.getElementById('thread-title').value.trim();
      const content = document.getElementById('thread-content').value.trim();
      const category = document.getElementById('thread-category').value;
      if (!title || !content) { App.showToast('Please fill in all fields', 'error'); return; }

      try {
          const response = await fetch('Forum.aspx/CreateThread', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, category })
          });
          const data = await response.json();
          
          if (data.d === 'success') {
              document.getElementById('new-thread-form').classList.remove('active');
              document.getElementById('thread-title').value = '';
              document.getElementById('thread-content').value = '';
              App.showToast('Thread created! 🎉', 'success');
              
              this.currentThread = null;
              await this.fetchThreads();
          } else {
              App.showToast('Failed to create thread: ' + data.d, 'error');
          }
      } catch(e) {
          console.error(e);
          App.showToast('Error creating thread', 'error');
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => Forum.init());
