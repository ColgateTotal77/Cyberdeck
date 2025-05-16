import { Notifications } from './Notifications.js';

document.getElementById('restorePasswordForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    formData.forEach((value, key) => {
        if(value === "") {
            Notifications.showNotification(`${key} can't be empty`, true);
        }
    });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.get("email")) && (formData.get("code") && formData.get("email") !== null)) {
        Notifications.showNotification("Invalid email address", true);
    }
    
    if(Notifications.errorCount == 0) {

        let urlParams = new URLSearchParams(formData);
        
        const response = await fetch('/remindPassword', {
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
            Notifications.showNotification(text, false);
            document.getElementById("restorePasswordForm").querySelectorAll('div').forEach(div => {
                div.classList.toggle("hidden");
                const inputs = div.querySelectorAll('input');
                if (div.classList.contains("hidden")) {
                    inputs.forEach(input => input.disabled = true);
                } else {
                    inputs.forEach(input => input.disabled = false);
                }
            });
        }
    }
    else {
        Notifications.errorCount = 0;
    }
});