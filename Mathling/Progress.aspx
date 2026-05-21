<%@ Page Title="Progress" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Progress.aspx.cs" Inherits="Mathling.Progress" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/progress.css">
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
    <div class="progress-page container">
      <div class="progress-header">
        <h1>Ã°Å¸â€œÅ  Progress &amp; Performance</h1>
        <p>Track your learning journey and see how you're improving over time.</p>
      </div>

      <div class="stats-row" id="stats-row"></div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>Ã°Å¸â€œË† Score History</h3>
          <div class="chart-canvas-wrap"><canvas id="line-chart"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Ã°Å¸â€œÅ  Completion</h3>
          <div class="donut-wrap">
            <canvas id="donut-chart" width="200" height="200"></canvas>
            <div class="donut-center">
              <div class="donut-value" id="donut-value">0%</div>
              <div class="donut-label">Chapters Complete</div>
            </div>
          </div>
        </div>
      </div>

      <div class="history-section">
        <h3>Ã°Å¸â€œÂ Quiz History</h3>
        <div class="card card-flat" style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr><th>Date</th><th>Chapter</th><th>Score</th><th>Time</th><th>Stars</th></tr>
            </thead>
            <tbody id="history-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=2"></script>
    <script src="/js/progress.js"></script>
</asp:Content>
