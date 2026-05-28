<%@ Page Title="Admin Dashboard" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Admin.aspx.cs" Inherits="Mathling.Admin" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/admin.css">
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
    <div class="admin-page container">
      <div class="admin-header">
        <h1> Admin Dashboard</h1>
        <p style="color:var(--text-secondary)">Platform overview and management tools</p>
      </div>

      <!-- Stats Row -->
      <div class="admin-stats" id="admin-stats"></div>

      <!-- Charts & Activity -->
      <div class="admin-grid">
        <div class="admin-card">
          <h3> Weekly Activity</h3>
          <div class="activity-chart-wrap"><canvas id="bar-chart"></canvas></div>
        </div>
        <div class="admin-card">
          <h3> Recent Activity</h3>
          <div class="activity-list" id="activity-feed"></div>
        </div>
      </div>

      <!-- Users & Feedback -->
      <div class="admin-grid">
        <div class="admin-card">
          <h3> User Management</h3>
          <div id="user-list"></div>
          <div style="margin-top:var(--space-md);display:flex;gap:var(--space-sm)">
            <a href="progress.aspx" class="btn btn-secondary btn-sm" style="flex:1">View Reports</a>
            <a href="moderate.aspx" class="btn btn-secondary btn-sm" style="flex:1">Moderate Content</a>
          </div>
        </div>
        <div class="admin-card">
          <h3> Recent Feedback</h3>
          <div id="feedback-list"></div>
        </div>
      </div>
      </div>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=10"></script>
    <script src="/js/admin.js?v=2"></script>
</asp:Content>



