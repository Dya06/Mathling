<%@ Page Title="Login" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="Mathling.Login" %>

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
        <h1 id="auth-title">Welcome Back!</h1>
        <p id="auth-subtitle">Log in to continue your learning adventure</p>
      </div>



      <div class="auth-card" id="auth-form">
        <!-- Login Form -->
        <div id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email</label>
            <input type="email" id="login-email" class="form-input" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="Enter your password" />
          </div>
          <button type="button" class="btn btn-primary btn-lg" id="login-submit-btn" style="width:100%">Log In</button>
        </div>


      </div>

      <!-- Demo Accounts -->
      <div class="demo-accounts">
        <h4>Try Demo Accounts</h4>
        <div class="demo-account">
          <span class="demo-role">Student</span>
          <span>student@demo.com</span>
          <button type="button" class="demo-fill" onclick="fillDemo('student@demo.com','demo123')">Fill</button>
        </div>
        <div class="demo-account">
          <span class="demo-role">Parent</span>
          <span>parent@demo.com</span>
          <button type="button" class="demo-fill" onclick="fillDemo('parent@demo.com','demo123')">Fill</button>
        </div>
        <div class="demo-account">
          <span class="demo-role">Instructor</span>
          <span>instructor@demo.com</span>
          <button type="button" class="demo-fill" onclick="fillDemo('instructor@demo.com','demo123')">Fill</button>
        </div>
        <div class="demo-account">
          <span class="demo-role">Admin</span>
          <span>admin@demo.com</span>
          <button type="button" class="demo-fill" onclick="fillDemo('admin@demo.com','demo123')">Fill</button>
        </div>
      </div>

      <div class="auth-footer">
        <p>Don't have an account? <a href="Register.aspx" style="color:var(--primary);font-weight:600;text-decoration:none;">Create one</a></p>
        <br>
        <a href="Default.aspx">← Back to Home</a>
      </div>
    </div>
  </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=4"></script>
    <script src="/js/auth.js?v=4"></script>
    <script>
      function fillDemo(email, password) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
        App.showToast('Demo credentials filled! Click Log In.', 'info');
      }
    </script>
</asp:Content>
