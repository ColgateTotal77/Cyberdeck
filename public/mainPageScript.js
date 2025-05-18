// Add a button to clear the deck
function setupClearDeckButton() {
    // Add clear deck button to deck modal
    const deckHeader = document.querySelector('.deckHeader');
    const clearButton = document.createElement('button');
    clearButton.id = 'clearDeck';
    clearButton.className = 'clearDeckBtn';
    clearButton.textContent = 'Clear Deck';
    clearButton.style.marginLeft = 'auto';
    clearButton.style.marginRight = '60px'; // Space before close button
    deckHeader.appendChild(clearButton);
    
    // Add event listener
    clearButton.addEventListener('click', () => {
        if (activeCards.length > 0) {
            // Move all active cards back to inactive
            inactiveCards = [...inactiveCards, ...activeCards];
            activeCards = [];
            renderDeckModal();
            renderMainGrid();
            Notifications.showNotification("Deck cleared successfully", false);
        } else {
            Notifications.showNotification("Deck is already empty", false);
        }
    });
}import { Notifications } from './Notifications.js';
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

// All available card names (can be replaced with real names or loaded from server)
const allCards = [
    "Card 1", "Card 2", "Card 3", "Card 4", "Card 5", "Card 6",
    "Card 7", "Card 8", "Card 9", "Card 10", "Card 11", "Card 12",
    "Card 13","Card 14", "Card 15", "Card 16", "Card 17", "Card 18",
    "Card 19","Card 20", "Card 21", "Card 22", "Card 23", "Card 24", 
    "Card 25", "Card 26", "Card 27", "Card 28", "Card 29", "Card 30"
];

// Separate into active and inactive
let activeCards = []; // Start with empty active deck
let inactiveCards = [...allCards]; // All cards start as inactive

// Initial render for main grid
function renderMainGrid() {
    const cardsGrid = document.getElementById("cardsGrid");
    cardsGrid.innerHTML = ""; // Clear existing cards
    
    if (activeCards.length === 0) {
        // If deck is empty, display all empty slots
        for (let i = 0; i < 12; i++) {
            const emptyCard = document.createElement("div");
            emptyCard.className = "card empty-card";
            cardsGrid.appendChild(emptyCard);
        }
    } else {
        // Add active cards to the main grid
        activeCards.forEach((cardName, index) => {
            const cardDiv = document.createElement("div");
            cardDiv.className = "card";
            cardDiv.style.backgroundImage = `url('/image/exampleCard.png')`;
            cardDiv.dataset.cardName = cardName;
            cardDiv.title = cardName;
            cardsGrid.appendChild(cardDiv);
        });
        
        // If we have fewer than 12 active cards, fill with empty slots
        const emptySlots = 12 - activeCards.length;
        for (let i = 0; i < emptySlots; i++) {
            const emptyCard = document.createElement("div");
            emptyCard.className = "card empty-card";
            cardsGrid.appendChild(emptyCard);
        }
    }
}

// Render both active and inactive cards in the deck modal
function renderDeckModal() {
    const activeGrid = document.getElementById("activeCardGrid");
    const inactiveList = document.getElementById("inactiveCardList");

    // Clear previous content
    activeGrid.innerHTML = "";
    inactiveList.innerHTML = "";

    // Render active cards
    activeCards.forEach((name, index) => {
        const card = document.createElement("div");
        card.className = "cardItem";
        card.innerHTML = `
            <img src="/image/exampleCard.png" alt="${name}">
            <span>${name}</span>
            <button class="removeCard" data-index="${index}">✖</button>
        `;
        activeGrid.appendChild(card);
    });

    // Render inactive cards
    inactiveCards.forEach((name, index) => {
        const card = document.createElement("div");
        card.className = "cardItem";
        card.innerHTML = `
            <img src="/image/exampleCard.png" alt="${name}">
            <span>${name}</span>
            <button class="addCard" data-index="${index}">＋</button>
        `;
        inactiveList.appendChild(card);
    });

    // Save deck state to localStorage for persistence
    saveCardState();
}

// Save card state to localStorage
function saveCardState() {
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
    localStorage.setItem('inactiveCards', JSON.stringify(inactiveCards));
}

// Load card state from localStorage
function loadCardState() {
    const savedActiveCards = localStorage.getItem('activeCards');
    const savedInactiveCards = localStorage.getItem('inactiveCards');
    
    if (savedActiveCards && savedInactiveCards) {
        activeCards = JSON.parse(savedActiveCards);
        inactiveCards = JSON.parse(savedInactiveCards);
    } else {
        // If no saved state, start with empty deck
        activeCards = [];
        inactiveCards = [...allCards];
    }
}

// Attach event listeners for the deck modal
function setupDeckModalListeners() {
    // Open/close modal
    document.getElementById('changeButton').addEventListener('click', () => {
        renderDeckModal();
        document.getElementById('carddeckModal').classList.remove('hidden');
    });

    document.getElementById('closeCarddeck').addEventListener('click', () => {
        document.getElementById('carddeckModal').classList.add('hidden');
    });

    // Event delegation for add/remove card buttons
    document.getElementById('activeCardGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('removeCard')) {
            const index = parseInt(e.target.dataset.index);
            const removedCard = activeCards[index];
            inactiveCards.push(removedCard);
            activeCards.splice(index, 1);
            renderDeckModal();
            renderMainGrid(); // Update main grid when removing cards
            Notifications.showNotification(`Removed ${removedCard} from your deck`, false);
        }
    });

    document.getElementById('inactiveCardList').addEventListener('click', (e) => {
        if (e.target.classList.contains('addCard')) {
            const index = parseInt(e.target.dataset.index);
            if (activeCards.length < 12) {
                activeCards.push(inactiveCards[index]);
                inactiveCards.splice(index, 1);
                renderDeckModal();
                renderMainGrid(); // Update main grid when adding cards
                Notifications.showNotification(`Added ${activeCards[activeCards.length-1]} to your deck`, false);
            } else {
                Notifications.showNotification("Maximum 12 active cards allowed!", true);
            }
        }
    });
}

// Settings Modal Event Listeners
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


document.addEventListener("DOMContentLoaded", () => {
    loadCardState();
    
    renderMainGrid();
    
    setupDeckModalListeners();
    
    setupClearDeckButton();
});