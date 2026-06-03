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
        <!-- REMOVED THE DUPLICATE FORM TAG FROM HERE -->
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
                        <asp:TextBox
                            ID="RegName"
                            runat="server"
                            CssClass="form-input"
                            placeholder="Enter your name"> 
                        </asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="reg-email">Email</label>
                        <asp:TextBox
                            ID="RegEmail"
                            runat="server"
                            TextMode="Email"
                            CssClass="form-input"
                            placeholder="Enter your email">
                        </asp:TextBox>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="reg-password">Password</label>
                        <asp:TextBox
                            ID="RegPassword"
                            runat="server"
                            TextMode="Password"
                            CssClass="form-input"
                            placeholder="Create a password">
                        </asp:TextBox>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            I am a...
                        </label>

                        <asp:DropDownList
                            ID="RegRole"
                            runat="server"
                            CssClass="form-input">
                            <asp:ListItem Text="Select Role" Value=""></asp:ListItem>
                            <asp:ListItem Text="Student" Value="student"></asp:ListItem>
                            <asp:ListItem Text="Parent" Value="parent"></asp:ListItem>
                        </asp:DropDownList>
                    </div>

                    <asp:Label
                        ID="ErrorMessage"
                        runat="server"
                        ForeColor="Red"
                        Visible="false">
                    </asp:Label>

                    <br />
                    <br />
                    
                    <asp:Button
                        ID="RegBtn"
                        runat="server"
                        Text="Create Account"
                        CssClass="btn btn-primary btn-lg"
                        Style="width: 100%"
                        OnClick="RegBtn_Click" />
                </div>
            </div>

            <div class="auth-footer">
                <p>Already have an account? <a href="Login.aspx" style="color: var(--primary); font-weight: 600; text-decoration: none;">Log In</a></p>
                <br>
                <a href="Default.aspx"> Back to Home</a>
            </div>
        </div>
        <!-- REMOVED THE DUPLICATE CLOSING FORM TAG FROM HERE -->
    </main>
</asp:Content>

<asp:Content ID="ScriptContent" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=12"></script>
</asp:Content>



