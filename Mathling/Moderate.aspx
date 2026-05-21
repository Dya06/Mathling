<%@ Page Title="Moderation" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Moderate.aspx.cs" Inherits="Mathling.Moderate" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/moderate.css">
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
    <div class="moderate-page container">
      <div class="moderate-header">
        <h1>Ã°Å¸â€ºÂ¡Ã¯Â¸Â Content Moderation</h1>
        <p style="color:var(--text-secondary)">Submit new exercises or review pending content</p>
      </div>

      <!-- Submit Section (Instructor Only) -->
      <div id="submit-section" class="submission-form card" style="margin-bottom:var(--space-2xl)">
        <h3>Ã°Å¸â€œÂ¤ Submit New Content</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-md)">
          <div class="form-group" style="margin:0">
            <label class="form-label" for="sub-title">Title</label>
            <input type="text" id="sub-title" class="form-input" placeholder="Exercise title...">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" for="sub-chapter">Chapter</label>
            <select id="sub-chapter" class="form-input form-select">
              <option>Counting Beads</option><option>Simple Addition</option>
              <option>Simple Subtraction</option><option>Double Digits</option>
              <option>Speed Challenge</option><option>Multiplication Intro</option>
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" for="sub-difficulty">Difficulty</label>
            <select id="sub-difficulty" class="form-input form-select">
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>
        </div>
        <button class="btn btn-accent-green" id="submit-content-btn">Submit for Review</button>
      </div>

      <!-- Review Section -->
      <div>
        <h3 style="margin-bottom:var(--space-md)">Ã°Å¸â€œâ€¹ Review Queue</h3>
        <p id="review-actions-note" style="display:none;font-size:var(--text-sm);color:var(--accent-blue);margin-bottom:var(--space-md)">
          As an admin, you can approve or reject submissions below.
        </p>
        <div class="status-filters">
          <button class="tag status-filter active" data-status="all">All</button>
          <button class="tag status-filter" data-status="pending">Ã¢ÂÂ³ Pending</button>
          <button class="tag status-filter" data-status="approved">Ã¢Å“â€¦ Approved</button>
          <button class="tag status-filter" data-status="rejected">Ã¢ÂÅ’ Rejected</button>
        </div>
        <div class="review-list" id="review-list"></div>
      </div>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=2"></script>
    <script src="/js/moderate.js"></script>
</asp:Content>
