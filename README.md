# 🧮 Mathlings

**Mathlings** is a web-based abacus mental arithmetic learning platform for children aged 4–11.

## 🚀 Getting Started

### Open in Visual Studio
1. Clone the repository: `git clone https://github.com/Dya06/Mathling.git`
2. Open `Mathlings.sln` in Visual Studio
3. Right-click `index.html` → **View in Browser**

### Open in VS Code
1. Clone the repository
2. Open the folder in VS Code
3. Use the **Live Server** extension to run `index.html`

### Run with any HTTP server
```bash
npx serve .
```

## 📁 Project Structure
```
├── index.html          # Home page
├── login.html          # Login & Registration
├── quiz.html           # Formula learning engine
├── profile.html        # User profile (role-based)
├── progress.html       # Progress tracking & charts
├── forum.html          # Community forum
├── moderate.html       # Content moderation
├── admin.html          # Admin dashboard
├── favicon.svg         # Logo
├── css/
│   ├── variables.css   # Design tokens
│   ├── base.css        # Reset & global styles
│   ├── components.css  # UI component library
│   ├── layout.css      # Grid & navigation
│   ├── home.css        # Home page styles
│   ├── login.css       # Auth page styles
│   ├── quiz.css        # Quiz/learning styles
│   ├── profile.css     # Profile page styles
│   ├── progress.css    # Progress page styles
│   ├── forum.css       # Forum styles
│   ├── moderate.css    # Moderation styles
│   └── admin.css       # Admin dashboard styles
├── js/
│   ├── app.js          # Core app logic, auth, nav
│   ├── auth.js         # Login/registration
│   ├── abacus.js       # Interactive abacus component
│   ├── quiz.js         # Formula learning engine
│   ├── profile.js      # Role-based profile
│   ├── progress.js     # Canvas charts & stats
│   ├── forum.js        # Forum threads & replies
│   ├── moderate.js     # Content moderation
│   └── admin.js        # Admin dashboard
├── Mathlings.sln       # Visual Studio solution
└── Mathlings.csproj    # Visual Studio project
```

## 🎯 Features
- **Formula-based learning** — SF+4, with modules A through E
- **Interactive soroban abacus** — Click beads to calculate
- **Vertical question display** — Traditional arithmetic format
- **Flash & static modes** — Different display modes per set
- **Mental mode** — Practice without abacus
- **Timed assessments** — 1-minute final assessment
- **Role-based access** — Student, Parent, Instructor, Admin
- **Dark mode** — Full dark/light theme support
- **Text-to-speech** — Audio support for young learners

## 🔑 Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | demo123 |
| Parent | parent@demo.com | demo123 |
| Instructor | instructor@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

## 🛠 Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- No external dependencies
- localStorage for data persistence (frontend demo)
- Backend TODO comments throughout codebase

## 📝 License
All rights reserved.
