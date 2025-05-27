import { Notifications } from './Notifications.js';

if (localStorage.getItem("userCreateSuccess") === "true") {
    Notifications.showNotification("User registered successfully", false);
    localStorage.removeItem("userCreateSuccess");
}

document.getElementById('loginForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.forEach((value, key) => {
        if (value === "") {
            Notifications.showNotification(`${key} can't be empty`, true);
        }
    });

    if (Notifications.errorCount === 0) {
        let urlParams = new URLSearchParams(formData);

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlParams.toString()
        });

        const text = await response.text();
        if (!response.ok) {
            Notifications.showNotification(text, true);
        } 
        else {
            localStorage.setItem("loginSuccess", "true");
            window.location.href = "/mainPage";
        }
    } 
    else {
        Notifications.errorCount = 0;
    }
});