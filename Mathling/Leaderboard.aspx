<%@ Page Title="Leaderboard" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Leaderboard.aspx.cs" Inherits="Mathling.Leaderboard" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/leaderboard.css">
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
        <div class="container leaderboard-page">
            <div class="leaderboard-header">
                <h1>Global Leaderboard</h1>
                <p style="color:var(--text-secondary)">See how you stack up against other Mathlings!</p>
            </div>
            
            <div class="leaderboard-container">
                <div class="leaderboard-list" id="leaderboard-list">
                    <!-- Leaderboard items injected via JS -->
                </div>
            </div>
        </div>
    </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=13"></script>
    <script src="/js/leaderboard.js?v=1"></script>
</asp:Content>
