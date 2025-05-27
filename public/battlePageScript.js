import { Socket } from './battlePageClient.js'
import { Notifications } from './Notifications.js';

const dataObj = await fetch('/api/getBattleInfo').then(res => res.json());
const allCards = await fetch('/api/getAllCards').then(res => res.json());

const battleInfo = dataObj.battleInfo;
const userId = dataObj.userId;
const roomId = battleInfo.roomId;
const user = battleInfo.player1.userData.id === userId ? battleInfo.player1 : battleInfo.player2;
const opponent = battleInfo.player2.userData.id === userId ? battleInfo.player1 : battleInfo.player2;

let isMyTurn = user.userData.id === battleInfo.current_turn_player_id;
document.getElementById("turnStatus").innerText = isMyTurn ? "Your Turn!" : "Opponent's Turn...";

console.log( user.userData.id);
const userResponse = await fetch('/api/getAvatarPath', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: user.userData.id })
});
if (!userResponse.ok) {
    throw new Error('Failed to fetch user data');
}
const userAvatarPath = await userResponse.json();

const opponentResponse = await fetch('/api/getAvatarPath', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: opponent.userData.id })
});
if (!opponentResponse.ok) {
    throw new Error('Failed to fetch opponent data');
}
const opponentAvatarPath = await opponentResponse.json();

const opponentAvatar = document.getElementById("opponentAvatar");
document.getElementById("userAvatar").innerHTML = `<img src="${userAvatarPath.avatarPath}">`;
opponentAvatar.innerHTML = `<img src="${opponentAvatarPath.avatarPath}">`;

console.log(user);
console.log(opponent);
console.log(allCards);

// document.getElementById("userInfo").innerHTML = user.userData.login;
// document.getElementById("opponentInfo").innerHTML = opponent.userData.login;
        //     player1: {userData: user, hp:30, mana: 4, handCards: userHandCards, tableCards: [], deck: userDeck},
        //     player2: {userData: opponent, hp:30, mana: 4, handCards: opponentHandCards, tableCards: [], deck: opponentDeck},
        //     roomId: roomId,
        //     current_turn_player_id : current_turn_player_id

document.getElementById("userLogin").innerHTML = user.userData.login;
document.getElementById("opponentLogin").innerHTML = opponent.userData.login;

console.log(user.hp, opponent.hp, user.mana)

document.getElementById("userHP").innerText = `${user.hp}`;
document.getElementById("opponentHP").innerText = `${opponent.hp}`;
document.getElementById("userMana").innerText = `${user.mana}`;

const userCardsContainer = document.getElementById('userHand');
const opponentCardsContainer = document.getElementById('opponentHand');
const userTable = document.getElementById('userTable');
const opponentTable = document.getElementById('opponentTable');

function renderHandCard(cardData) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('draggable', true);
    card.dataset.cardId = cardData.id;
    
    // Create the main card image
    const cardImg = document.createElement('img');
    cardImg.src = cardData.card_img_path || '/image/exampleCard.png';
    cardImg.alt = cardData.name;
    cardImg.classList.add('card-img');
    
    // Create overlay container for all text elements
    const cardOverlay = document.createElement("div");
    cardOverlay.className = "card-overlay";
    
    // Stats container
    const cardStats = document.createElement("div");
    cardStats.className = "cardStats";
    cardStats.innerHTML = `
        <div class="cardName">${cardData.name}</div>
    `;
    
    // Description container
    const cardDescription = document.createElement("div");
    cardDescription.className = "cardDescription";
    cardDescription.innerHTML = `
        <div class="cardDescriptionStyle">${cardData.description}</div>
    `;
    
    // Cost container
    const cardCost = document.createElement("div");
    cardCost.className = "cardCost";
    cardCost.innerHTML = `
        <div class="cardCost">${cardData.cost}</div>
    `;
    
    // Attack container
    const cardAttack = document.createElement("div");
    cardAttack.className = "cardAttack";
    cardAttack.innerHTML = `
        <div class="cardAttack">${cardData.attack}</div>
    `;
    
    // HP container
    const cardHp = document.createElement("div");
    cardHp.className = "cardHp";
    cardHp.innerHTML = `
        <div class="cardHp">${cardData.hp}</div>
    `;
    
    // Append all text elements to overlay
    cardOverlay.appendChild(cardStats);
    cardOverlay.appendChild(cardDescription);
    cardOverlay.appendChild(cardCost);
    cardOverlay.appendChild(cardAttack);
    cardOverlay.appendChild(cardHp);
    
    // Append image and overlay to card
    card.appendChild(cardImg);
    card.appendChild(cardOverlay);
    
    // Set tooltip
    card.title = `${cardData.name}: ${cardData.description}`;
    
    // Add drag event listener
    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('cardId', cardData.id);
    });
    
    return card;
}

function renderTableCard(cardData, cardInstanceId, isOpponent = false) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.cardId = cardData.id;
    card.dataset.instanceId = cardInstanceId;
    
    // Create the card image element (background layer)
    const cardImg = document.createElement('img');
    cardImg.src = cardData.card_img_path || '/image/exampleCard.png';
    cardImg.alt = cardData.name;
    cardImg.classList.add('card-img');
    
    // Create overlay container for all text elements
    const cardOverlay = document.createElement("div");
    cardOverlay.className = "card-overlay";
    
    // Stats container
    const cardStats = document.createElement("div");
    cardStats.className = "cardStats";
    cardStats.innerHTML = `
        <div class="cardName">${cardData.name}</div>
    `;
    
    // Description container
    const cardDescription = document.createElement("div");
    cardDescription.className = "cardDescription";
    cardDescription.innerHTML = `
        <div class="cardDescriptionStyle">${cardData.description}</div>
    `;
    
    // Cost container
    const cardCost = document.createElement("div");
    cardCost.className = "cardCost";
    cardCost.innerHTML = `
        <div class="cardCost">${cardData.cost}</div>
    `;
    
    // Attack container
    const cardAttack = document.createElement("div");
    cardAttack.className = "cardAttack";
    cardAttack.innerHTML = `
        <div class="cardAttack">${cardData.attack}</div>
    `;
    
    // HP container
    const cardHp = document.createElement("div");
    cardHp.className = "cardHp";
    cardHp.innerHTML = `
        <div class="card-Hp">${cardData.hp}</div>
    `;
    
    // Append all text elements to overlay
    cardOverlay.appendChild(cardStats);
    cardOverlay.appendChild(cardDescription);
    cardOverlay.appendChild(cardCost);
    cardOverlay.appendChild(cardAttack);
    cardOverlay.appendChild(cardHp);
    
    // Append image and overlay to card
    card.appendChild(cardImg);
    card.appendChild(cardOverlay);
    
    // Set tooltip
    card.title = `${cardData.name}: ${cardData.description}`;
    
    // Handle drag and drop logic
    if (!isOpponent) {
        card.setAttribute('draggable', true);
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('attackerInstanceId', card.dataset.instanceId);
        });
    } 
    else {
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            const attackerInstanceId = e.dataTransfer.getData('attackerInstanceId');
            const defenderInstanceId = card.dataset.instanceId;
            if (isMyTurn && attackerInstanceId && defenderInstanceId) {
                Socket.socket.emit('cardAttack', {attackerInstanceId: attackerInstanceId, defenderInstanceId: defenderInstanceId});
            }
        });
    }
    
    return card;
}


function renderUserHand() {
    user.handCards.forEach(cardId => {
        const cardData = allCards.find(card => card.id === cardId);
        if (cardData) {
            const cardElement = renderHandCard(cardData);
            userCardsContainer.appendChild(cardElement);
        }
    });
}

function renderOpponentHand() {
    opponent.handCards.forEach(() => {
        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        cardBack.innerHTML = `
            <img src="/image/cardBack.png" alt="cardBack" class="card-img"/>
            <img src="/image/cardBackAnim.gif" alt="anim" class="card-anim"/>
        `;
        opponentCardsContainer.appendChild(cardBack);
    });
}

function renderUserTable() {
    user.tableCards.forEach(cardData => {
        const cardElement = renderTableCard(cardData, cardData.instanceId);
        userTable.appendChild(cardElement);
    });
}

function renderOpponentTable() {
    opponent.tableCards.forEach(cardData => {
        const cardElement = renderTableCard(cardData, cardData.instanceId, true);
        opponentTable.appendChild(cardElement);
    });
}


userTable.addEventListener('dragover', (e) => {
    e.preventDefault();
});

userTable.addEventListener('drop', (e) => {
    e.preventDefault();

    const cardId = e.dataTransfer.getData('cardId');

    Socket.socket.emit('cardPlaced', Number(cardId));
});

Socket.socket.on('cardPlaced', ({ by, cardId, cardInstanceId}) => {
    const cardData = allCards.find(card => card.id === cardId);
    if (!cardData) return;
    if (by === user.userData.id) {
        const cardElement = renderTableCard(cardData, cardInstanceId);
        const handCard = [...userCardsContainer.children].find(child =>
            child.dataset.cardId === String(cardId)
        );
        if (handCard) {
            handCard.remove();
        }
        userTable.appendChild(cardElement);
    } 
    else {
        const cardElement = renderTableCard(cardData, cardInstanceId, true);
        const handCard = [...opponentCardsContainer.children][0];
        if (handCard) {
            handCard.remove();
        }
        opponentTable.appendChild(cardElement);
    }
});

Socket.socket.on('newMana', (mana) => {
    document.getElementById("userMana").innerText = `${mana}`;
});

let timerInterval;
function startCountdown(seconds) {
    clearInterval(timerInterval);
    let timeLeft = seconds;
    document.getElementById("turnTimer").innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("turnTimer").innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

document.getElementById("endTurn").addEventListener("click", () => {
    Socket.endTurn(roomId);
});
const turnStatus = document.getElementById("turnStatus");

function startTurn(isMyTurn, timeLimit) {
    turnStatus.innerText = isMyTurn ? "Your Turn!" : "Opponent's Turn...";
    startCountdown(timeLimit);
}

Socket.socket.on('turnStarted', ({ currentPlayerId, timeLimit}) => {
    isMyTurn = user.userData.id === currentPlayerId;
    startTurn(isMyTurn, timeLimit);
});

Socket.socket.on('attackResult', ({ attackerInstanceId, defenderInstanceId, newDefenderHp, isDefenderDead, by }) => {
    const tableToUpdate = by === user.userData.id ? opponentTable : userTable;
    const card = [...tableToUpdate.children].find(c => c.dataset.instanceId === String(defenderInstanceId));
    if (!card) return;

    if (isDefenderDead) {
        card.remove();
    } 
    else {
        const hpElement = card.querySelector('.card-Hp');
        if (hpElement) {
            hpElement.innerText = `${newDefenderHp}`;
        }
    }
});

Socket.socket.on('newCards', (cardsToChoose) => {
    renderCardsToChoose(cardsToChoose);
});

const newCardsDiv = document.getElementById("newCards");

function renderCardsToChoose(array) {
    console.log(array);
    if(array.length > 0) {
        array.forEach(cardId => {
            const cardData = allCards.find(card => card.id === cardId);
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.cardId = cardData.id;
            
            // Create the main card image
            const cardImg = document.createElement('img');
            cardImg.src = cardData.card_img_path || '/image/exampleCard.png';
            cardImg.alt = cardData.name;
            cardImg.classList.add('card-img');
            
            // Create overlay container for all text elements
            const cardOverlay = document.createElement("div");
            cardOverlay.className = "card-overlay";
            
            // Stats container
            const cardStats = document.createElement("div");
            cardStats.className = "cardStatsChoosen";
            cardStats.innerHTML = `
                <div class="cardNameChoosen">${cardData.name}</div>
            `;
            
            // Description container
            const cardDescription = document.createElement("div");
            cardDescription.className = "cardDescriptionChoosen";
            cardDescription.innerHTML = `
                <div class="cardDescriptionStyleChoosen">${cardData.description}</div>
            `;
            
            // Cost container
            const cardCost = document.createElement("div");
            cardCost.className = "cardCostChoosen";
            cardCost.innerHTML = `
                <div class="cardCostChoosen">${cardData.cost}</div>
            `;
            
            // Attack container
            const cardAttack = document.createElement("div");
            cardAttack.className = "cardAttackChoosen";
            cardAttack.innerHTML = `
                <div class="cardAttackChoosen">${cardData.attack}</div>
            `;
            
            // HP container
            const cardHp = document.createElement("div");
            cardHp.className = "cardHpChoosen";
            cardHp.innerHTML = `
                <div class="cardHpChoosen">${cardData.hp}</div>
            `;
            
            // Append all text elements to overlay
            cardOverlay.appendChild(cardStats);
            cardOverlay.appendChild(cardDescription);
            cardOverlay.appendChild(cardCost);
            cardOverlay.appendChild(cardAttack);
            cardOverlay.appendChild(cardHp);
            
            // Append image and overlay to card
            card.appendChild(cardImg);
            card.appendChild(cardOverlay);
            
            // Set tooltip
            card.title = `${cardData.name}: ${cardData.description}`;
            
            // Add click event listener
            card.addEventListener("click", () => {
                Socket.socket.emit("choosenCard", Number(card.dataset.cardId));
            });
            
            newCardsDiv.appendChild(card);
        });
        newCardsDiv.style.display = "block";
        newCardsDiv.classList.add('show');
    }
}

Socket.socket.on('newHandCard', (cardId) => {
    newCardsDiv.classList.remove('show');
    newCardsDiv.style.display = "none";
    newCardsDiv.innerHTML = "";

    const cardData = allCards.find(card => card.id === cardId);
    const cardElement = renderHandCard(cardData);
    userCardsContainer.appendChild(cardElement);
});

Socket.socket.on("newOpponentHandCard", () => {
    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    cardBack.innerHTML = `
        <img src="/image/cardBack.png" alt="cardBack" class="card-img"/>
        <img src="/image/cardBackAnim.gif" alt="anim" class="card-anim"/>
    `;
    opponentCardsContainer.appendChild(cardBack);
});

opponentAvatar.addEventListener("dragover", (e) => {
    e.preventDefault();
});

opponentAvatar.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!isMyTurn) return;
    const cardInstanceId = e.dataTransfer.getData('attackerInstanceId');
    Socket.socket.emit('opponentAttacked', cardInstanceId);
});

Socket.socket.on("userHpDecrease", ({defeanserId, newHp}) => {
    if(userId === defeanserId) {
        document.getElementById("userHP").innerText = `${newHp}`;
    }
    else {
        document.getElementById("opponentHP").innerText = `${newHp}`;
    }
});

const endGameWindow = document.getElementById("endGameWindow");
endGameWindow.style.display = "none"; // hidden by default

Socket.socket.on("matchEnded", ({ winnerData, loserData }) => {
    const isWinner = winnerData.userId === userId;
    const resultText = isWinner ? "YOU WIN" : "YOU LOSE";
    const rating = isWinner ? winnerData.plusRating : loserData.plusRating;

    endGameWindow.innerHTML = `
        <div class="end-game-content">
            <h1 class="cyber-title">${resultText}</h1>
            <p class="cyber-rating">Rating: <span>${rating}</span></p>
            <button id="backButton" class="cyber-btn">⬅ BACK TO MAIN</button>
        </div>
    `;
    endGameWindow.style.display = "flex";

    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "/mainPage";
    });
});

const randomCard = document.getElementById("randomCard");

randomCard.addEventListener("click", () => {
    console.log("click");
    Socket.socket.emit("giveRandomCard");
}) 

Socket.socket.on("notification", ({message, isError}) => {
    Notifications.showNotification(message, isError);
});

// Initial render
renderUserHand();
renderOpponentHand();
renderUserTable()
renderOpponentTable()
renderCardsToChoose(user.cardsToChoose);
startTurn(isMyTurn, 30);

document.getElementById('giveUpButton').addEventListener('click', () => {
    if (confirm("Are you sure you want to give up this battle?")) {
        Socket.giveUp();
    }
})

// Inside battlePageScript.js, after defining user and opponent
const turnAnnouncement = document.getElementById("turnAnnouncement");

if (battleInfo.current_turn_player_id === user.userData.id) {
    showTurnMessage("Your turn!");
} else {
    showTurnMessage(`${opponent.userData.login}'s turn!`);
}

function showTurnMessage(message) {
    turnAnnouncement.textContent = message;
    turnAnnouncement.classList.remove('hidden');
    requestAnimationFrame(() => {
        turnAnnouncement.classList.add('show');
    });

    setTimeout(() => {
        turnAnnouncement.classList.remove('show');
        setTimeout(() => {
            turnAnnouncement.classList.add('hidden');
        }, 500);
    }, 2500);
}