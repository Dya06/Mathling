<%@ Page Title="Home" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="Mathling._Default" %>

<asp:Content ID="HeadContent" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="/css/home.css" />
</asp:Content>

<asp:Content ID="BodyContent" ContentPlaceHolderID="MainContent" runat="server">

  <!-- Navigation -->
  <nav class="navbar" id="navbar">
    <div class="navbar-inner">
      <a href="Default.aspx" class="navbar-brand">
        <img src="/favicon.svg" alt="Mathlings" class="navbar-logo" />
        <span class="navbar-title">Math<span>lings</span></span>
      </a>
      <div class="navbar-nav" id="main-nav"></div>
      <div class="navbar-actions">
        <button class="audio-toggle" id="audio-toggle" aria-label="Toggle audio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </button>
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode"></button>
        <a href="Login.aspx" class="btn btn-primary btn-sm" id="nav-auth-btn">Get Started</a>
        <button class="hamburger" id="hamburger" aria-label="Menu">
          <div class="hamburger-lines"><span></span><span></span><span></span></div>
        </button>
      </div>
    </div>
  </nav>
  <div class="mobile-nav" id="mobile-nav"></div>

  <main class="main">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <div class="hero-badge">&#x1F9D2; For ages 4Ã¢â‚¬â€œ11</div>
            <h1>Make Math <span class="highlight">Magical</span> with the Abacus</h1>
            <p class="hero-desc">Mathlings turns mental arithmetic into an exciting adventure. Watch your child master numbers through interactive abacus exercises, fun quizzes, and rewarding challenges.</p>
            <div class="hero-buttons">
              <a href="Login.aspx" class="btn btn-primary btn-lg">&#x2728; Get Started Free</a>
              <a href="#features" class="btn btn-secondary btn-lg">Learn More</a>
            </div>
            <div class="hero-stats">
              <div>
                <div class="hero-stat-value" data-count="2500">0</div>
                <div class="hero-stat-label">Happy Learners</div>
              </div>
              <div>
                <div class="hero-stat-value" data-count="150">0</div>
                <div class="hero-stat-label">Exercises</div>
              </div>
              <div>
                <div class="hero-stat-value" data-count="98">0</div>
                <div class="hero-stat-label">% Fun Rate</div>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="float-element">&#x2B50;</div>
            <div class="float-element">&#x1F3AF;</div>
            <div class="float-element">&#x1F3C6;</div>
            <div class="float-element">&#x1F522;</div>
            <div class="abacus-hero">
              <div class="abacus-frame">
                <div class="abacus-rod">
                  <div class="abacus-bead red"></div>
                  <div class="abacus-bead yellow"></div>
                  <div class="abacus-bead blue"></div>
                  <div class="abacus-bead green"></div>
                  <div class="abacus-bead purple"></div>
                </div>
                <div class="abacus-rod">
                  <div class="abacus-bead yellow"></div>
                  <div class="abacus-bead green"></div>
                  <div class="abacus-bead red"></div>
                  <div class="abacus-bead blue"></div>
                  <div class="abacus-bead orange"></div>
                </div>
                <div class="abacus-rod">
                  <div class="abacus-bead blue"></div>
                  <div class="abacus-bead red"></div>
                  <div class="abacus-bead green"></div>
                  <div class="abacus-bead yellow"></div>
                  <div class="abacus-bead purple"></div>
                </div>
                <div class="abacus-rod">
                  <div class="abacus-bead green"></div>
                  <div class="abacus-bead purple"></div>
                  <div class="abacus-bead yellow"></div>
                  <div class="abacus-bead orange"></div>
                  <div class="abacus-bead blue"></div>
                </div>
                <div class="abacus-rod">
                  <div class="abacus-bead orange"></div>
                  <div class="abacus-bead blue"></div>
                  <div class="abacus-bead purple"></div>
                  <div class="abacus-bead red"></div>
                  <div class="abacus-bead green"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="container">
        <div class="section-header">
          <h2>Why Kids Love Mathlings</h2>
          <p>Our platform combines proven abacus techniques with modern gamification to make learning math genuinely enjoyable.</p>
        </div>
        <div class="feature-grid">
          <div class="feature-card" data-animate>
            <div class="feature-icon yellow">&#x1F9EE;</div>
            <h3>Interactive Abacus</h3>
            <p>A beautifully designed digital abacus with smooth bead interactions that makes learning tactile and fun.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon blue">&#x1F3AE;</div>
            <h3>Gamified Learning</h3>
            <p>Stars, badges, levels, and streaks keep kids motivated and excited to practice every day.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon green">&#x1F4CA;</div>
            <h3>Track Progress</h3>
            <p>Parents and teachers can monitor performance with detailed charts and insights in real-time.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon red">&#x1F3AF;</div>
            <h3>Structured Chapters</h3>
            <p>Step-by-step curriculum from basic counting to advanced mental arithmetic Ã¢â‚¬â€ at your child's pace.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon purple">&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;</div>
            <h3>Family Friendly</h3>
            <p>Parents can link accounts, monitor progress, and connect with instructors through our community forum.</p>
          </div>
          <div class="feature-card" data-animate>
            <div class="feature-icon orange">&#x1F50A;</div>
            <h3>Audio Support</h3>
            <p>Text-to-speech for young learners who are still developing reading skills. Every question can be read aloud.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <div class="container">
        <div class="section-header">
          <h2>How It Works</h2>
          <p>Getting started is as easy as 1-2-3!</p>
        </div>
        <div class="steps-grid">
          <div class="step" data-animate>
            <div class="step-number"><span class="step-emoji">&#x1F4DD;</span></div>
            <h3>Create Account</h3>
            <p>Sign up as a student, parent, or instructor in seconds. It's completely free to start.</p>
          </div>
          <div class="step" data-animate>
            <div class="step-number"><span class="step-emoji">&#x1F9EE;</span></div>
            <h3>Start Learning</h3>
            <p>Choose a chapter and begin practicing with our interactive abacus. Learn at your own pace.</p>
          </div>
          <div class="step" data-animate>
            <div class="step-number"><span class="step-emoji">&#x1F3C6;</span></div>
            <h3>Earn Rewards</h3>
            <p>Earn stars, unlock badges, and level up as you master each skill. Celebrate every achievement!</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials">
      <div class="container">
        <div class="section-header">
          <h2>What Parents Say</h2>
          <p>Join thousands of happy families already learning with Mathlings</p>
        </div>
        <div class="testimonial-grid">
          <div class="testimonial-card" data-animate>
            <div class="testimonial-stars">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <p class="testimonial-text">"My 6-year-old went from struggling with basic addition to doing mental math in weeks. The gamification keeps her coming back every day!"</p>
            <div class="testimonial-author">
              <div class="avatar avatar-sm" style="background: linear-gradient(135deg, #FF6B6B, #E03E3E);">L</div>
              <div>
                <div class="testimonial-author-name">Lisa M.</div>
                <div class="testimonial-author-role">Parent of a 6-year-old</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card" data-animate>
            <div class="testimonial-stars">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <p class="testimonial-text">"As an instructor, the content moderation tools make it easy to create and submit exercises. The platform is beautifully designed."</p>
            <div class="testimonial-author">
              <div class="avatar avatar-sm" style="background: linear-gradient(135deg, #4DABF7, #1C7ED6);">R</div>
              <div>
                <div class="testimonial-author-name">Robert T.</div>
                <div class="testimonial-author-role">Abacus Instructor</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card" data-animate>
            <div class="testimonial-stars">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <p class="testimonial-text">"The progress tracking dashboard is incredible. I can see exactly where my kids excel and where they need more practice."</p>
            <div class="testimonial-author">
              <div class="avatar avatar-sm" style="background: linear-gradient(135deg, #51CF66, #2F9E44);">J</div>
              <div>
                <div class="testimonial-author-name">James K.</div>
                <div class="testimonial-author-role">Parent of two learners</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-box" data-animate>
          <h2>Ready to Make Math Fun? &#x1F680;</h2>
          <p>Join thousands of families and start your child's abacus learning journey today. It's free to get started!</p>
          <a href="Login.aspx" class="btn btn-primary btn-lg">&#x2728; Start Learning Now</a>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid" style="grid-template-columns: 2fr 1fr 1fr;">
        <div>
          <div class="footer-brand">
            <img src="/favicon.svg" alt="Mathlings" width="32" height="32" />
            <span class="navbar-title">Math<span>lings</span></span>
          </div>
          <p class="footer-desc">Making mental arithmetic fun and accessible for every child through the timeless power of the abacus.</p>
        </div>
        <div>
          <h4 class="footer-title">Platform</h4>
          <a href="Quiz.aspx" class="footer-link">Learning Center</a>
          <a href="Progress.aspx" class="footer-link">Progress Tracking</a>
          <a href="Forum.aspx" class="footer-link">Community Forum</a>
        </div>
        <div>
          <h4 class="footer-title">Company</h4>
          <a href="#" class="footer-link">About Us</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 Mathlings. All rights reserved.</span>
      </div>
    </div>
  </footer>

</asp:Content>

<asp:Content ID="Scripts" ContentPlaceHolderID="ScriptContent" runat="server">
    <script src="/js/app.js?v=2"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('[data-count]').forEach(function(el) {
          App.animateCounter(el, parseInt(el.dataset.count));
        });
        App.observeAnimations();

        var authBtn = document.getElementById('nav-auth-btn');
        if (App.state.currentUser && authBtn) {
          authBtn.textContent = 'Dashboard';
          var dest = { student: 'Quiz.aspx', parent: 'Progress.aspx', instructor: 'Forum.aspx', admin: 'Admin.aspx' };
          authBtn.href = dest[App.state.currentUser.role] || 'Profile.aspx';
        }
      });
    </script>
</asp:Content>
