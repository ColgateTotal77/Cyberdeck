import { Notifications } from './Notifications.js';
import { testSocket } from './client.js'

if (localStorage.getItem("loginSuccess") === "true") {
    Notifications.showNotification("You have logged in successfully!", false);
    localStorage.removeItem("loginSuccess");
}

fetch('/userData', { method: 'POST' })
    .then(response => {
        if (!response.ok) {
            Notifications.showNotification("Network response was not ok", true);
        }
        return response.json();
    })
    .then(data => {
        const html = `
            <div>Login: ${data.login}</div>
            <div>Full name: ${data.fullName}</div>
            <div>Is Admin: <span style="color:${data.isAdmin ? 'green' : 'red'};">${data.isAdmin ? "Yes" : "No"}</span></div>
            <div>Email: ${data.email}</div>`;
        document.getElementById("login").innerHTML = data.login;
        document.getElementById("userData").innerHTML = html;
    })
    .catch(error => {
        console.log(error);
        Notifications.showNotification('There was a problem with the fetch operation: ' + error, true);
    });

document.getElementById("playButton").addEventListener('click', () => {
    testSocket();
})

document.getElementById('changeButton').addEventListener('click', () => {
    document.getElementById('carddeckModal').classList.remove('hidden');
});

document.getElementById('closeCarddeck').addEventListener('click', () => {
    document.getElementById('carddeckModal').classList.add('hidden');
});

document.querySelector(".settingButton").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.remove("hidden");
});

document.querySelector(".closeSettings").addEventListener("click", () => {
    document.getElementById("settingsModal").classList.add("hidden");
});

document.querySelectorAll(".settingsTab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".settingsTab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".settingsSection").forEach(s => s.classList.remove("active"));

        tab.classList.add("active");
        const tabName = tab.getAttribute("data-tab");
        document.getElementById(tabName + "Settings").classList.add("active");
    });
});
