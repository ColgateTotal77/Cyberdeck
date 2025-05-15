export class Notifications {
    static timeDelay = 0;
    static notificationContainer = document.getElementById("notificationContainer");
    static errorCount = 0;

    static showNotification(text, error){
        const currentDelay = Notifications.timeDelay;
        Notifications.timeDelay += 1000;

        if(error) {
            Notifications.errorCount += 1;
        }

        setTimeout(() => {
            const notification = document.createElement("div");

            notification.textContent = text;
            notification.style.background = error ? "#F44336" : "#4CAF50";
            notification.className = "notification";
            notification.style.width = `${Math.min(300, text.length * 8 + 40)}px`;
            Notifications.notificationContainer.prepend(notification);

            setTimeout(() => {
                notification.classList.add("show");
            }, 20);

            setTimeout(() => {
                notification.classList.remove("show");
                Notifications.timeDelay -= 1000;
                setTimeout(() => {
                    Notifications.notificationContainer.removeChild(notification);
                }, 300);
            }, 3000);  
        }, currentDelay);
    }
}