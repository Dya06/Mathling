const Auth = {
    init() {
        const form = document.getElementById('auth-form');
        if (!form) return;

        this.setupForm();
        this.setupRoleSelector();
    },

    setupRoleSelector() {
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', () => {

                document.querySelectorAll('.role-option')
                    .forEach(o => o.classList.remove('selected'));

                option.classList.add('selected');

                document.getElementById('selected-role').value =
                    option.dataset.role;
            });
        });
    },

    setupForm() {

        document.getElementById('login-submit-btn')
            ?.addEventListener('click', async (e) => {

                e.preventDefault();

                const email =
                    document.getElementById('login-email').value.trim();

                const password =
                    document.getElementById('login-password').value;

                if (!email || !password) {
                    App.showToast('Please fill in all fields', 'error');
                    return;
                }

                try {

                    const response = await fetch('Login.aspx/LoginUser', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    });

                    const data = await response.json();

                    if (data.d && data.d.startsWith('success')) {
                        const parts = data.d.split('|');
                        const role = parts[1];
                        const name = parts[2];
                        const id = parts[3];

                        const avatars = { student: '🧒', parent: '👩', instructor: '👨‍🏫', admin: '🛡️' };

                        const user = {
                            id: parseInt(id),
                            name: name,
                            role: role,
                            email: email,
                            avatar: avatars[role] || '👤',
                            level: 1,
                            xp: 0
                        };

                        App.login(user);
                        App.showToast(`Welcome back, ${user.name}! 🎉`, 'success');

                        setTimeout(() => {
                            const dest = { student: 'Quiz.aspx', parent: 'Progress.aspx', instructor: 'Forum.aspx', admin: 'Admin.aspx' };
                            window.location.href = dest[role] || 'Default.aspx';
                        }, 800);

                    } else {

                        this.showError(
                            'login-email',
                            'Invalid email or password'
                        );

                        App.showToast(
                            'Invalid email or password',
                            'error'
                        );
                    }

                } catch (error) {

                    console.error(error);

                    App.showToast(
                        'Server error',
                        'error'
                    );
                }
            });

        document.getElementById('register-submit-btn')
            ?.addEventListener('click', () => {

                App.showToast(
                    'Registration backend not implemented yet',
                    'info'
                );
            });
    },

    showError(inputId, message) {

        const input = document.getElementById(inputId);

        if (!input) return;

        input.classList.add('form-input-error');

        let errorEl =
            input.parentElement.querySelector('.form-error');

        if (!errorEl) {

            errorEl = document.createElement('div');

            errorEl.className = 'form-error';

            input.parentElement.appendChild(errorEl);
        }

        errorEl.textContent = message;

        setTimeout(() => {

            input.classList.remove('form-input-error');

            errorEl?.remove();

        }, 3000);
    },
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});