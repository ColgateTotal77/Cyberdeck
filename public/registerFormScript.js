import { Notifications } from './Notifications.js';

document.getElementById('registerForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.forEach((value, key) => {
        if(value === "") {
            Notifications.showNotification(`${key} can't be empty`, true);
        }
    });

    const confirmPassword = document.querySelector('input[name="confirmPassword"]');
    if(formData.get("password") != formData.get("confirmPassword")) {
        Notifications.showNotification("Passwords don't match!", true);
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.get("email"))) {
        Notifications.showNotification("Invalid email address", true);
    }
    
    if(Notifications.errorCount === 0) {
        formData.delete('confirmPassword');
        const urlParams = new URLSearchParams(formData);
        
        const response = await fetch('/register', {
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
            localStorage.setItem("userCreateSuccess", "true");
            window.location.href = "/loginForm";
        }
    }
    else {
        Notifications.errorCount = 0;
    }
});