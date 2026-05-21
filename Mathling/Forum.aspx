<%@ Page Title="Forum" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Forum.aspx.cs" Inherits="Mathling.Forum" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/forum.css">
</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">
  <nav class="navbar"><div class="navbar-inner">
    <a href="Default.aspx" class="navbar-brand"><img src="/favicon.svg" alt="Mathlings" class="navbar-logo"><span class="navbar-title">Math<span>lings</span></span></a>
    <div class="navbar-nav" id="main-nav"></div>
    <div class="navbar-actions">
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"></button>
      <button class="hamburger" id="hamburger" aria-label="Menu"><div class="hamburger-lines"><span></span><span></span><span></span></div></button>
    </div>
  </div></nav>
  <div class="mobile-nav" id="mobile-nav"></div>

  <main class="main">
    <div class="forum-page container">
      <div class="forum-header">
        <div>
          <h1>ðŸ’¬ Community Forum</h1>
          <p style="color:var(--text-secondary)">Connect with instructors and other parents</p>
        </div>
        <button class="btn btn-primary" id="new-thread-btn">+ New Thread</button>
      </div>

      <!-- New Thread Form -->
      <div class="new-thread-form card" id="new-thread-form" style="margin-bottom:var(--space-xl)">
        <h3 style="margin-bottom:var(--space-lg)">ðŸ“ Create New Thread</h3>
        <div class="form-group">
          <label class="form-label" for="thread-title">Title</label>
          <input type="text" id="thread-title" class="form-input" placeholder="Thread title...">
        </div>
        <div class="form-group">
          <label class="form-label" for="thread-category">Category</label>
          <select id="thread-category" class="form-input form-select">
            <option value="General">General</option>
            <option value="Tips">Tips</option>
            <option value="Questions">Questions</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="thread-content">Content</label>
          <textarea id="thread-content" class="form-input" placeholder="Write your post..." rows="4"></textarea>
        </div>
        <button class="btn btn-accent-green" id="submit-thread">Post Thread</button>
      </div>

      <!-- Filters -->
      <div class="forum-filters">
        <button class="tag forum-filter active" data-filter="all">All</button>
        <button class="tag forum-filter" data-filter="General">ðŸ’¡ General</button>
        <button class="tag forum-filter" data-filter="Tips">ðŸŽ¯ Tips</button>
        <button class="tag forum-filter" data-filter="Questions">â“ Questions</button>
      </div>

      <!-- Threads -->
      <div class="thread-list" id="thread-list"></div>
      <div id="thread-detail" style="display:none"></div>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js"></script>
    <script src="/js/forum.js"></script>
</asp:Content>
