import { Notifications } from './Notifications.js';
import { startFindOpponent, cancelMatch } from './mainPageClient.js'

window.isDeckBlocked = false;

fetch('/userData', { method: 'POST' })
    .then(response => {
        if (!response.ok) {
        }
        return response.json();
    })
    .then(data => {
        document.getElementById("login").innerHTML = data.login;
        document.querySelector(".ratingBox").textContent = data.rating;
        document.getElementById("avatar").innerHTML = `<img src="${data.avatarPath}">`;
    })
    .catch(error => {
        console.log(error);
    });

export function showSearchingIndicator(isSearching) {
    const playButton = document.getElementById("playButton");
    if (isSearching) {
        playButton.classList.add("searching");
        playButton.innerHTML = `<span>Cancel</span>`;
        Notifications.showNotification('The search was started:', false);
    } else {
        playButton.classList.remove("searching");
        playButton.innerHTML = '<span aria-hidden>PLAY</span> <span aria-hidden class="cybr-btn__glitch">PLAY</span>';
        Notifications.showNotification('The search was canceled:', true);
    }
}

function hideChangeButton() {
    const btn = document.getElementById('changeButton');
    btn.classList.remove('fade-in');
    btn.classList.add('fade-out');
    btn.addEventListener('animationend', () => {
        btn.style.display = 'none';
        btn.classList.remove('fade-out');
    }, { once: true });
}

function showChangeButton() {
    const btn = document.getElementById('changeButton');
    btn.style.display = 'flex';
    btn.classList.remove('fade-out', 'fade-in');

    void btn.offsetWidth;

    btn.classList.add('fade-in');
}

function setDeckBlockedStatus(isBlocked) {
    window.isDeckBlocked = isBlocked;
    if (isBlocked) {
        hideChangeButton();
    } else {
        showChangeButton();
    }
}

let isSearching = false;

document.getElementById("playButton").addEventListener('click', () => {
    if (isSearching) {
        cancelMatch(); 
        setDeckBlockedStatus(false);
        isSearching = false;
        return;
    }

    if (activeCards.length < 12) {
        Notifications.showNotification("You need exactly 12 cards in your deck to battle!", true);
        return;
    }

    startFindOpponent(activeCards.map((card) => card.id));
    setDeckBlockedStatus(true);
    showSearchingIndicator(true);
    isSearching = true;
});


function setupClearDeckButton() {
    const deckHeader = document.querySelector('.deckHeader');
    const clearButton = document.createElement('button');
    clearButton.id = 'clearDeck';
    clearButton.className = 'clearDeckBtn cyber-button-small bg-black fg-red';
    clearButton.textContent = 'Clear Deck';
    clearButton.style.marginLeft = 'auto';
    clearButton.style.marginRight = '60px';
    deckHeader.appendChild(clearButton);
    
    clearButton.addEventListener('click', () => {
        if (activeCards.length > 0) {
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

let allCards = []; 
let activeCards = []; 
let inactiveCards = [];
let allMatchHistory = [];

function renderMainGrid() {
    const cardsGrid = document.getElementById("cardsGrid");
    cardsGrid.innerHTML = "";

    activeCards.forEach((card) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "card";
        if (card.card_img_path) {
            cardDiv.style.backgroundImage = `url('${card.card_img_path}')`;
        }
        cardDiv.dataset.cardId = card.id;

        const cardStats = document.createElement("div");
        cardStats.className = "cardStats";
        cardStats.innerHTML = `
            <div class="cardName">${card.name}</div>
        `;

        const cardDescription = document.createElement("div");
        cardDescription.className = "cardDescription";
        cardDescription.innerHTML = `
            <div class="cardDescriptionStyle">${card.description}</div>
        `;

        const cardCost = document.createElement("div");
        cardCost.className = "cardCost";
        cardCost.innerHTML = `
            <div class="cardCost">${card.cost}</div>
        `;

        const cardAttack = document.createElement("div");
        cardAttack.className = "cardAttack";
        cardAttack.innerHTML = `
            <div class="cardAttack">${card.attack}</div>
        `;

        const cardHp = document.createElement("div");
        cardHp.className = "cardHp";
        cardHp.innerHTML = `
            <div class="cardHp">${card.hp}</div>
        `;

        cardDiv.appendChild(cardStats);
        cardDiv.appendChild(cardDescription);
        cardDiv.appendChild(cardCost);
        cardDiv.appendChild(cardAttack);
        cardDiv.appendChild(cardHp);


        cardDiv.title = `${card.name}: ${card.description}`;
        cardsGrid.appendChild(cardDiv);
    });

    const emptySlots = 12 - activeCards.length;
    for (let i = 0; i < emptySlots; i++) {
        const emptyCard = document.createElement("div");
        emptyCard.className = "card";
        cardsGrid.appendChild(emptyCard);
    }
}


function renderDeckModal() {
    const activeGrid = document.getElementById("activeCardGrid");
    const inactiveList = document.getElementById("inactiveCardList");

    activeGrid.innerHTML = "";
    inactiveList.innerHTML = "";

    activeCards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.className = "cardItem";
        cardElement.innerHTML = `
            <img src="${card.card_img_path || '/image/exampleCard.png'}" alt="${card.name}">
            <div class="cardDetails">
                <span class="cardNameinDeck">${card.name}</span>
            </div>
            <div class="cardDescriptioninDeck"><div class="cardDescriptionStyleinDeck">${card.description}</div></div>
            <div class="cardCostinDeck">${card.cost}</div>
            <div class="cardAttackinDeck">${card.attack}</div>
            <div class="cardHpinDeck">${card.hp}</div>
        `;

        cardElement.addEventListener("click", () => {
            if (window.isDeckBlocked) return;
            inactiveCards.push(activeCards[index]);
            activeCards.splice(index, 1);
            renderDeckModal();
            renderMainGrid();
        });

        activeGrid.appendChild(cardElement);
    });

    inactiveCards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.className = "cardItem";
        cardElement.innerHTML = `
            <img src="${card.card_img_path || '/image/exampleCard.png'}" alt="${card.name}">
            <div class="cardDetails">
                <span class="cardNameinDeck">${card.name}</span>
            </div>
            <div class="cardDescriptioninDeck"><div class="cardDescriptionStyleinDeck">${card.description}</div></div>
            <div class="cardCostinDeck">${card.cost}</div>
            <div class="cardAttackinDeck">${card.attack}</div>
            <div class="cardHpinDeck">${card.hp}</div>
        `;

        cardElement.addEventListener("click", () => {
            if (window.isDeckBlocked) return;
            if (activeCards.length >= 12) {
                Notifications.showNotification("Maximum 12 active cards allowed!", true);
                return;
            }
            activeCards.push(inactiveCards[index]);
            inactiveCards.splice(index, 1);
            renderDeckModal();
            renderMainGrid();
        });

        inactiveList.appendChild(cardElement);
    });

    const clearDeckBtn = document.getElementById('clearDeck');
    if (clearDeckBtn) clearDeckBtn.disabled = window.isDeckBlocked;

    saveCardState();
}


function saveCardState() {
    localStorage.setItem('activeCards', JSON.stringify(activeCards));
    localStorage.setItem('inactiveCards', JSON.stringify(inactiveCards));
}

function loadCardState() {
    const savedActiveCards = localStorage.getItem('activeCards');
    const savedInactiveCards = localStorage.getItem('inactiveCards');
    
    if (savedActiveCards && savedInactiveCards) {
        const parsedActiveCards = JSON.parse(savedActiveCards);
        const parsedInactiveCards = JSON.parse(savedInactiveCards);
        
        const activeCardIds = new Set(parsedActiveCards.map(card => card.id));
        const inactiveCardIds = new Set(parsedInactiveCards.map(card => card.id));
        
        activeCards = allCards.filter(card => activeCardIds.has(card.id));
        
        const missingActiveCardIds = Array.from(activeCardIds).filter(
            id => !activeCards.some(card => card.id === id)
        );
        
        inactiveCards = allCards.filter(card => 
            !activeCardIds.has(card.id) || missingActiveCardIds.includes(card.id)
        );
    } else {
        inactiveCards = [...allCards];
    }
}

function setupDeckModalListeners() {
    document.getElementById('changeButton').addEventListener('click', () => {
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

    document.getElementById('activeCardGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('removeCard') && !window.isDeckBlocked) {
            const index = parseInt(e.target.dataset.index);
            inactiveCards.push(activeCards[index]);
            activeCards.splice(index, 1);
            renderDeckModal();
            renderMainGrid();
        }
    });

    document.getElementById('inactiveCardList').addEventListener('click', (e) => {
        if (e.target.classList.contains('addCard') && !window.isDeckBlocked) {
            const index = parseInt(e.target.dataset.index);
            if (activeCards.length < 12) {
                activeCards.push(inactiveCards[index]);
                inactiveCards.splice(index, 1);
                renderDeckModal();
                renderMainGrid();
            } else {
                Notifications.showNotification("Maximum 12 active cards allowed!", true);
            }
        }
    });
}

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

document.addEventListener("DOMContentLoaded", async () => {
    try {

        let response = await fetch('/api/getAllCards');
        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }

        allCards = await response.json();
        
        response = await fetch('/api/getAllMatchHistory');
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        allMatchHistory = await response.json();
        
        loadCardState();
        
        renderMainGrid();
        
        setupClearDeckButton();
        setupDeckModalListeners();
        if (allMatchHistory && Array.isArray(allMatchHistory.allMatches)) {
            renderMatchHistory();
        }
    } catch (error) {
        console.error('Error initializing card data:', error);
        Notifications.showNotification('Failed to load cards. Please refresh the page.', true);
    }
});

function renderMatchHistory() {
    const historyContainer = document.querySelector('.MatchHistory');

    historyContainer.querySelectorAll('.match-entry').forEach(el => el.remove());

    const currentYear = new Date().getFullYear();

    allMatchHistory.allMatches.forEach(match => {
        if (!match || !match.end_time) return; 

        const { opponent_login, start_time, end_time, rating_change } = match;
        if (!opponent_login || !start_time) return;

        const start = new Date(start_time);
        const end = new Date(end_time);

        const day = start.getDate().toString().padStart(2, '0');
        const month = (start.getMonth() + 1).toString().padStart(2, '0');
        const year = start.getFullYear();
        const dateStr = (year === currentYear) ? `${day}.${month}` : `${day}.${month}.${year}`;

        const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
        const endTimeStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

        let result = '?';
        let ratingStr = '-';
        if (rating_change !== null) {
            result = rating_change > 0 ? 'W' : 'L';
            ratingStr = rating_change > 0 ? `+${rating_change}` : `${rating_change}`;
        }

        const entry = document.createElement('div');
        entry.classList.add('match-entry');
        entry.textContent = `${result} ${opponent_login} ${ratingStr} | ${dateStr} ${startTimeStr} → ${endTimeStr}`;

        historyContainer.appendChild(entry);
    });
}


document.getElementById('avatarForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!file || !file.type.startsWith('image/')) {
        e.preventDefault();
        alert('Please upload a valid image file.');
        return;
    }

    try {
        const response = await fetch('/uploadAvatar', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("avatar").innerHTML = `<img src="${data.avatarPath}">`;
        } else {
            console.error('Upload error:', data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Network error:', error);
    }
});