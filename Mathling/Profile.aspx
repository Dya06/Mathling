<%@ Page Title="Profile" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Profile.aspx.cs" Inherits="Mathling.Profile" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="css/profile.css">
</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">
  <nav class="navbar"><div class="navbar-inner">
    <a href="Default.aspx" class="navbar-brand"><img src="favicon.svg" alt="Mathlings" class="navbar-logo"><span class="navbar-title">Math<span>lings</span></span></a>
    <div class="navbar-nav" id="main-nav"></div>
    <div class="navbar-actions">
      <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"></button>
      <button class="hamburger" id="hamburger" aria-label="Menu"><div class="hamburger-lines"><span></span><span></span><span></span></div></button>
    </div>
  </div></nav>
  <div class="mobile-nav" id="mobile-nav"></div>

  <main class="main">
    <section class="profile-hero">
      <div class="container">
        <div class="profile-avatar" id="profile-avatar">👤</div>
        <h1 class="profile-name" id="profile-name">User</h1>
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
      <button class="btn btn-ghost" onclick="App.logout()" style="color:var(--accent-red)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Log Out
      </button>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="js/app.js"></script>
    <script src="js/profile.js"></script>
</asp:Content>
