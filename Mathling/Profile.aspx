<%@ Page Title="Profile" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Profile.aspx.cs" Inherits="Mathling.Profile" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/profile.css">
</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">
  <nav class="navbar"><div class="navbar-inner">
    <a href="Default.aspx" class="navbar-brand"><img src="/favicon.svg" alt="Mathlings" class="navbar-logo"><span class="navbar-title">Math<span>lings</span></span></a>
    <div class="navbar-nav" id="main-nav"></div>
    <div class="navbar-actions">
      <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"></button>
      <button type="button" class="hamburger" id="hamburger" aria-label="Menu"><div class="hamburger-lines"><span></span><span></span><span></span></div></button>
    </div>
  </div></nav>
  <div class="mobile-nav" id="mobile-nav"></div>

  <main class="main">
    <section class="profile-hero">
      <div class="container">
        <div class="profile-avatar" id="profile-avatar">&#128100;</div>
        <h1 class="profile-name" id="profile-name" style="display:inline-block; margin-right:10px;">User</h1>
        <button type="button" class="btn btn-sm btn-ghost" id="edit-profile-btn" style="vertical-align: super; padding: 4px 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Edit
        </button>
        <br />
        <span class="badge badge-blue profile-role" id="profile-role-badge">User</span>
        <div class="profile-level-bar" id="level-section" style="display:none">
          <div class="profile-level-info">
            <span id="level-num">Level 1</span>
            <span id="xp-text">0 / 500 XP</span>
          </div>
          <div class="progress-bar progress-bar-yellow">
            <div class="progress-bar-fill" id="xp-fill" style="width:0%"></div>
          </div>
        </div>
      </div>
    </section>
    <section class="profile-body">
      <div class="container" id="profile-content">
        <div style="text-align:center;padding:var(--space-3xl)"><div class="spinner spinner-lg" style="margin:0 auto"></div></div>
      </div>
    </section>
    <div style="text-align:center;padding-bottom:var(--space-2xl)">
      <button type="button" class="btn btn-ghost" onclick="App.logout()" style="color:var(--accent-red)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Log Out
      </button>
    </div>
  </main>

  <!-- Edit Profile Modal -->
  <div class="modal-overlay" id="edit-profile-modal">
    <div class="modal">
      <div class="modal-header">
        <h3>Edit Profile</h3>
        <button type="button" class="modal-close" id="edit-profile-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" id="edit-name-input" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Avatar</label>
          <div class="avatar-grid" id="avatar-grid" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;">
            <!-- Avatars will be injected by JS -->
          </div>
        </div>
      </div>
      <div class="modal-footer" style="text-align:right; margin-top:20px;">
        <button type="button" class="btn btn-ghost" id="edit-profile-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="edit-profile-save">Save Changes</button>
      </div>
    </div>
  </div>

  <!-- Link Student Modal -->
  <div class="modal-overlay" id="link-student-modal">
    <div class="modal">
      <div class="modal-header">
        <h3>Link a Student</h3>
        <button type="button" class="modal-close" id="link-student-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Student's Email Address</label>
          <input type="email" id="link-student-email" class="form-input" placeholder="e.g. student@demo.com" />
        </div>
        <div id="link-student-error" style="color:var(--accent-red);font-size:var(--text-sm);margin-top:var(--space-sm);display:none;"></div>
      </div>
      <div class="modal-footer" style="text-align:right; margin-top:20px;">
        <button type="button" class="btn btn-ghost" id="link-student-cancel">Cancel</button>
        <button type="button" class="btn btn-primary" id="link-student-save">Link Student</button>
      </div>
    </div>
  </div>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=9"></script>
    <script src="/js/profile.js?v=14"></script>
</asp:Content>