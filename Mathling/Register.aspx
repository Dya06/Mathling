<%@ Page Title="Register" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Register.aspx.cs" Inherits="Mathling.Register" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/login.css">
</asp:Content>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">
  <!-- Minimal Nav -->
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="Default.aspx" class="navbar-brand">
        <img src="/favicon.svg" alt="Mathlings" class="navbar-logo">
        <span class="navbar-title">Math<span>lings</span></span>
      </a>
      <div class="navbar-actions">
        <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"></button>
      </div>
    </div>
  </nav>

  <main class="auth-page main">
    <div class="auth-container">
      <div class="auth-header">
        <h1 id="auth-title">Join Mathlings!</h1>
        <p id="auth-subtitle">Create your account and start learning</p>
      </div>

      <div class="auth-card" id="auth-form">
        <!-- Register Form -->
        <div id="register-form">
          <div class="form-group">
            <label class="form-label" for="reg-name">Full Name</label>
            <input type="text" id="reg-name" class="form-input" placeholder="Enter your name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-email">Email</label>
            <input type="email" id="reg-email" class="form-input" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <input type="password" id="reg-password" class="form-input" placeholder="Create a password" />
          </div>
          <input type="hidden" id="selected-role" value="" />
          <div class="role-selector">
            <label class="form-label">I am a...</label>
            <div class="role-grid">
              <div class="role-option" data-role="student">
                <span class="role-emoji">🧒</span>
                <span class="role-name">Student</span>
              </div>
              <div class="role-option" data-role="parent">
                <span class="role-emoji">👩</span>
                <span class="role-name">Parent</span>
              </div>
              <div class="role-option" data-role="instructor">
                <span class="role-emoji">👨‍🏫</span>
                <span class="role-name">Instructor</span>
              </div>
              <div class="role-option" data-role="admin">
                <span class="role-emoji">🛡️</span>
                <span class="role-name">Admin</span>
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-lg" id="register-submit-btn" style="width:100%">Create Account</button>
        </div>
      </div>

      <div class="auth-footer">
        <p>Already have an account? <a href="Login.aspx" style="color:var(--primary);font-weight:600;text-decoration:none;">Log In</a></p>
        <br>
        <a href="Default.aspx">← Back to Home</a>
      </div>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=4"></script>
    <script src="/js/auth.js?v=4"></script>
</asp:Content>
