import { Notifications } from './Notifications.js';
import  { testSocket } from './client.js'

if (localStorage.getItem("loginSuccess") === "true") {
    Notifications.showNotification("You have logged in successfully!", false);
    localStorage.removeItem("loginSuccess");
}

fetch('/userData', {method: 'POST'})
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

document.getElementById("testButton").addEventListener('click', () => {
    testSocket();
})