// Modified mainPageScript.js to implement deck blocking and use DB cards
import { Notifications } from './Notifications.js';
import { startFindOpponent, cancelMatch } from './mainPageClient.js'

// Initialize deck blocking state
window.isDeckBlocked = false;

fetch('/userData', { method: 'POST' })
    .then(response => {
        if (!response.ok) {
            // Notifications.showNotification("Network response was not ok", true);
        }
        return response.json();
    })
    .then(data => {
        const html = 
            `<div>Login: ${data.login}</div>
            <div>Full name: ${data.fullName}</div>
            <div>Is Admin: <span style="color:${data.isAdmin ? 'green' : 'red'};">${data.isAdmin ? "Yes" : "No"}</span></div>
            <div>Email: ${data.email}</div>`;
        document.getElementById("login").innerHTML = data.login;
        // document.getElementById("userData").innerHTML = html;
        document.querySelector(".ratingBox").textContent = data.rating;

        fetch('/api/getAvatarPath', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id })
        })
            .then(response => {
                if (!response.ok) {
                    // Notifications.showNotification("Network response was not ok", true);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById("avatar").innerHTML = `<img src="${data.avatarPath}">`;
            })
            .catch(error => {
                console.log(error);
                // Notifications.showNotification('There was a problem with the fetch operation: ' + error, true);
            });
    })
    .catch(error => {
        console.log(error);
        // Notifications.showNotification('There was a problem with the fetch operation: ' + error, true);
    });

// Add a searching indicator for better UX
export function showSearchingIndicator(isSearching) {
    const playButton = document.getElementById("playButton");
    if (isSearching) {
        playButton.classList.add("searching");
        playButton.innerHTML = `
            <div class="searching-indicator">
                <span>Searching...</span>
                <button id="cancelSearch">Cancel</button>
            </div>
        `;
        // Add cancel search event listener
        document.getElementById("cancelSearch").addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering playButton's event
            setDeckBlockedStatus(false);
            cancelMatch();
            showSearchingIndicator(false);
        });
    } else {
        playButton.classList.remove("searching");
        playButton.innerHTML = '<span aria-hidden>PLAY</span> <span aria-hidden class="cybr-btn__glitch">PLAY</span>';
    }
}

// Add a new function to handle deck blocked status
function setDeckBlockedStatus(isBlocked) {
    window.isDeckBlocked = isBlocked;
    const changeButton = document.getElementById('changeButton');
    
    if (isBlocked) {
        changeButton.classList.add('blocked');
        // Add visual indication that deck is locked
        const existingLock = changeButton.querySelector('.lockIcon');
        if (!existingLock) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'lockIcon';
            lockIcon.innerHTML = '🔒';
            changeButton.appendChild(lockIcon);
        }
    } else {
        changeButton.classList.remove('blocked');
        // Remove lock icon if it exists
        const lockIcon = changeButton.querySelector('.lockIcon');
        if (lockIcon) {
            changeButton.removeChild(lockIcon);
        }
    }
}

document.getElementById("playButton").addEventListener('click', () => {
    // Check if there are 12 cards in the active deck
    if (activeCards.length < 12) {
        Notifications.showNotification("You need exactly 12 cards in your deck to battle!", true);
        return;
    }
    console.log(activeCards);

    startFindOpponent(activeCards.map((card) => {
        return card.id;
    }));
    setDeckBlockedStatus(true);
    showSearchingIndicator(true);
})

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
}

// Initialize empty card arrays
let allCards = []; 
let activeCards = []; 
let inactiveCards = [];

// Initial render for main grid
function renderMainGrid() {
    const cardsGrid = document.getElementById("cardsGrid");
    cardsGrid.innerHTML = ""; // Clear existing cards
    
    // Add active cards to the main grid
    activeCards.forEach((card) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        cardDiv.style.backgroundImage = card.image_url ? 
            `url('${card.image_url}')` : 
            `url('/image/exampleCard.png')`;
        cardDiv.dataset.cardId = card.id;
        
        // Add card stats overlay
        const cardStats = document.createElement("div");
        cardStats.className = "cardStats";
        cardStats.innerHTML = `
            <div class="cardName">${card.name}</div>
            <div class="cardCost">${card.cost}</div>
            <div class="cardAttack">${card.attack}</div>
            <div class="cardHp">${card.hp}</div>
        `;
        cardDiv.appendChild(cardStats);
        
        cardDiv.title = `${card.name}: ${card.description}`;
        cardsGrid.appendChild(cardDiv);
    });
    
    // If we have fewer than 12 active cards, fill with empty slots
    const emptySlots = 12 - activeCards.length;
    for (let i = 0; i < emptySlots; i++) {
        const emptyCard = document.createElement("div");
        emptyCard.className = "card";
        cardsGrid.appendChild(emptyCard);
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
    activeCards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.className = "cardItem";
        cardElement.innerHTML = `
            <img src="${card.image_url || '/image/exampleCard.png'}" alt="${card.name}">
            <div class="cardDetails">
                <span class="cardName">${card.name}</span>
                <div class="cardStats">
                    <span class="statItem cost">Cost: ${card.cost}</span>
                    <span class="statItem attack">ATK: ${card.attack}</span>
                    <span class="statItem hp">DEF: ${card.hp}</span>
                </div>
                <span class="cardDescription">${card.description}</span>
            </div>
            <button class="removeCard" data-index="${index}"${window.isDeckBlocked ? ' disabled' : ''}>✖</button>
        `;
        activeGrid.appendChild(cardElement);
    });

    // Render inactive cards
    inactiveCards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.className = "cardItem";
        cardElement.innerHTML = `
            <img src="${card.image_url || '/image/exampleCard.png'}" alt="${card.name}">
            <div class="cardDetails">
                <span class="cardName">${card.name}</span>
                <div class="cardStats">
                    <span class="statItem cost">Cost: ${card.cost}</span>
                    <span class="statItem attack">ATK: ${card.attack}</span>
                    <span class="statItem hp">DEF: ${card.hp}</span>
                </div>
                <span class="cardDescription">${card.description}</span>
            </div>
            <button class="addCard" data-index="${index}"${window.isDeckBlocked ? ' disabled' : ''}>＋</button>
        `;
        inactiveList.appendChild(cardElement);
    });

    // Update the Clear Deck button state
    const clearDeckBtn = document.getElementById('clearDeck');
    if (clearDeckBtn) {
        clearDeckBtn.disabled = window.isDeckBlocked;
    }

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
        const parsedActiveCards = JSON.parse(savedActiveCards);
        const parsedInactiveCards = JSON.parse(savedInactiveCards);
        
        // Make sure the cards exist in our full list (in case the DB was updated)
        const activeCardIds = new Set(parsedActiveCards.map(card => card.id));
        const inactiveCardIds = new Set(parsedInactiveCards.map(card => card.id));
        
        // Filter active cards to ensure they still exist in DB
        activeCards = allCards.filter(card => activeCardIds.has(card.id));
        
        // Add any cards that were active before but aren't in our filtered active list
        const missingActiveCardIds = Array.from(activeCardIds).filter(
            id => !activeCards.some(card => card.id === id)
        );
        
        // Handle any DB changes by ensuring all cards exist
        inactiveCards = allCards.filter(card => 
            !activeCardIds.has(card.id) || missingActiveCardIds.includes(card.id)
        );
    } else {
        // Default - all cards are inactive
        inactiveCards = [...allCards];
    }
}

// Attach event listeners for the deck modal
function setupDeckModalListeners() {
    // Open/close modal
    document.getElementById('changeButton').addEventListener('click', () => {
        // Prevent opening deck editor if blocked
        if (window.isDeckBlocked) {
            Notifications.showNotification("Cannot change deck while searching for a match!", true);
            return;
        }
        
        renderDeckModal();
        document.getElementById('carddeckModal').classList.remove('hidden');
    });

    document.getElementById('closeCarddeck').addEventListener('click', () => {
        document.getElementById('carddeckModal').classList.add('hidden');
    });

    // Event delegation for add/remove card buttons
    document.getElementById('activeCardGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('removeCard') && !window.isDeckBlocked) {
            const index = parseInt(e.target.dataset.index);
            inactiveCards.push(activeCards[index]);
            activeCards.splice(index, 1);
            renderDeckModal();
            renderMainGrid(); // Update main grid when removing cards
        }
    });

    document.getElementById('inactiveCardList').addEventListener('click', (e) => {
        if (e.target.classList.contains('addCard') && !window.isDeckBlocked) {
            const index = parseInt(e.target.dataset.index);
            if (activeCards.length < 12) {
                activeCards.push(inactiveCards[index]);
                inactiveCards.splice(index, 1);
                renderDeckModal();
                renderMainGrid(); // Update main grid when adding cards
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

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch cards from API
        const response = await fetch('/api/getAllCards');
        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }
        


        // Store all cards from the database
        allCards = await response.json();
        console.log('Loaded cards from database:', allCards);
        
        // Load saved card state
        loadCardState();
        
        // Initial render
        renderMainGrid();
        
        setupClearDeckButton();
        // Setup modal listeners
        setupDeckModalListeners();
    } catch (error) {
        console.error('Error initializing card data:', error);
        Notifications.showNotification('Failed to load cards. Please refresh the page.', true);
    }
});