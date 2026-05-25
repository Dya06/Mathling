const Auth = {
    init() {
        const form = document.getElementById('auth-form');
        if (!form) return;

        this.setupTabs();
        this.setupRoleSelector();
    },

    setupTabs() {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;

                document.querySelectorAll('.auth-tab')
                    .forEach(t => t.classList.remove('active'));

                tab.classList.add('active');

                document.getElementById('login-form').style.display =
                    mode === 'login' ? 'block' : 'none';

                document.getElementById('register-form').style.display =
                    mode === 'register' ? 'block' : 'none';

                document.getElementById('auth-title').textContent =
                    mode === 'login'
                        ? 'Welcome Back!'
                        : 'Join Mathlings!';

                document.getElementById('auth-subtitle').textContent =
                    mode === 'login'
                        ? 'Log in to continue your learning adventure'
                        : 'Create your account and start learning';
            });
        });
    },

    setupRoleSelector() {
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.role-option')
                    .forEach(o => o.classList.remove('selected'));

                option.classList.add('selected');

                const roleInput = document.getElementById('RegRole');
                if (roleInput) {
                    roleInput.value = option.dataset.role;
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Used by ASP.NET OnClientClick
function validateRegistration() {
    const roleInput = document.getElementById('RegRole');
    if (!roleInput || !roleInput.value) {
        App.showToast('Please select a role!', 'error');
        return false;
    }
    return true;
}