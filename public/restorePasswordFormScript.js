import { Notifications } from './Notifications.js';

const form = document.getElementById('restorePasswordForm');
const emailWrapper = form.querySelector('input[name="email"]').closest('div');
const emailInput   = form.querySelector('input[name="email"]');

const codeWrapper  = form.querySelector('.hidden-code');
const codeInput    = codeWrapper.querySelector('input[name="code"]');

const passWrapper  = form.querySelector('.hidden-password');
const passInput    = passWrapper.querySelector('input[name="password"]');

const submitBtn    = document.getElementById('submitButton');

let step = 1;

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    switch (step) {
        case 1:
            try {
                const res = await fetch('/remindPassword', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({email: emailInput.value})
                });
                const text = await res.text();
                if (!res.ok) {
                    Notifications.showNotification(text, true);
                    return;
                }
                Notifications.showNotification('Code sent to your email', false);

                emailWrapper.style.display = 'none';
                codeWrapper.style.display = 'block';
                codeInput.disabled = false;
                submitBtn.textContent = 'Verify Code';
                step = 2;

            } catch (err) {
                console.error(err);
                Notifications.showNotification('Network error', true);
            }
            break;
        case 2:
            try {
                const res = await fetch('/remindPassword', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({code: codeInput.value})
                });
                const text = await res.text();
                if (!res.ok) {
                    Notifications.showNotification(text, true);
                    return;
                }
                Notifications.showNotification('Code verified, enter new password', false);

                codeWrapper.style.display = 'none';
                passWrapper.style.display = 'block';
                passInput.disabled = false;
                submitBtn.textContent = 'Set Password';
                step = 3;

            } catch (err) {
                console.error(err);
                Notifications.showNotification('Network error', true);
            }
            break;
        case 3:
            try {
                const res = await fetch('/remindPassword', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({
                        code: codeInput.value,
                        password: passInput.value
                    })
                });
                const text = await res.text();
                if (!res.ok) {
                    Notifications.showNotification(text, true);
                    return;
                }
                Notifications.showNotification('Password successfully changed!', false);

                setTimeout(() => window.location.href = '/loginForm', 1500);

            } catch (err) {
                console.error(err);
                Notifications.showNotification('Network error', true);
            }
            break;
    }
});
