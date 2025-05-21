import { Socket } from './battlePageClient.js'

const dataObj = await fetch('/api/getBattleInfo').then(res => res.json());
const allCards = await fetch('/api/getAllCards').then(res => res.json());

const battleInfo = dataObj.battleInfo;
const userId = dataObj.userId;
const roomId = battleInfo.roomId;
const user = battleInfo.player1.userData.id === userId ? battleInfo.player1 : battleInfo.player2;
const opponent = battleInfo.player2.userData.id === userId ? battleInfo.player1 : battleInfo.player2;
let isMyTurn = user.userData.id === battleInfo.current_turn_player_id;

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

document.getElementById("userHP").innerText = `HP: ${user.hp}`;
document.getElementById("opponentHP").innerText = `HP: ${opponent.hp}`;

const userCardsContainer = document.getElementById('userHand');
const opponentCardsContainer = document.getElementById('opponentHand');
const userTable = document.getElementById('userTable');
const opponentTable = document.getElementById('opponentTable');

function renderCard(cardData) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('draggable', true);
    card.dataset.cardId = cardData.id;
    card.dataset.instanceId = cardData.instanceId || null;

    card.innerHTML = `
        <img src="${cardData.image_url || '/image/exampleCard.png'}" alt="${cardData.name}" class="card-img" />
        <div class="card-name">${cardData.name}</div>
        <div class="card-hp">HP: ${cardData.hp ?? 'N/A'}</div>
    `;

    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('cardId', card.dataset.cardId);
        e.dataTransfer.setData('attackerInstanceId', card.dataset.instanceId);
    });

    return card;
}

function renderHandCard(cardData) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('draggable', true);
    card.dataset.cardId = cardData.id;

    card.innerHTML = `
        <img src="${cardData.image_url || '/image/exampleCard.png'}" alt="${cardData.name}" class="card-img" />
        <div class="card-name">${cardData.name}</div>
        <div class="card-hp">HP: ${cardData.hp ?? 'N/A'}</div>
    `;

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

    card.innerHTML = `
        <img src="${cardData.image_url || '/image/exampleCard.png'}" alt="${cardData.name}" class="card-img" />
        <div class="card-name">${cardData.name}</div>
        <div class="card-hp">HP: ${cardData.hp} ATK: ${cardData.attack}</div>
    `;

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
            console.log(attackerInstanceId, defenderInstanceId);
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
        cardBack.innerHTML = `<img src="/image/cardBack.jpg" alt="cardBack" class="card-img" />`;
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
    Socket.socket.emit('cardPlaced', cardId);
});

Socket.socket.on('cardPlaced', ({ by, cardId, cardInstanceId }) => {
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

Socket.socket.on('turnStarted', ({ currentPlayerId, timeLimit }) => {
    isMyTurn = user.userData.id === currentPlayerId;

    document.getElementById("turnStatus").innerText = isMyTurn ? "Your Turn!" : "Opponent's Turn...";

    startCountdown(timeLimit);
});

Socket.socket.on('attackResult', ({ attackerInstanceId, defenderInstanceId, newDefenderHp, isDefenderDead, by }) => {
    const tableToUpdate = by === user.userData.id ? opponentTable : userTable;
    const card = [...tableToUpdate.children].find(c => c.dataset.instanceId === String(defenderInstanceId));
    if (!card) return;

    if (isDefenderDead) {
        card.remove();
    } 
    else {
        const hpElement = card.querySelector('.card-hp');
        if (hpElement) {
            hpElement.innerText = `HP: ${newDefenderHp}`;
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

            card.innerHTML = `
                <img src="${cardData.image_url || '/image/exampleCard.png'}" alt="${cardData.name}" class="card-img" />
                <div class="card-name">${cardData.name}</div>
                <div class="card-hp">HP: ${cardData.hp ?? 'N/A'}</div>
            `;
            card.addEventListener("click", () => {
                Socket.socket.emit("choosenCard", card.dataset.cardId);
                newCardsDiv.classList.remove('show');
                setTimeout(() => {
                    newCardsDiv.style.display = "none";
                }, 500);
                newCardsDiv.innerHTML = "";
            })

            newCardsDiv.appendChild(card);
        });
        newCardsDiv.style.display = "block";
        newCardsDiv.classList.add('show');
    }
}

Socket.socket.on('newHandCard', (cardId) => {
    const cardData = allCards.find(card => card.id === cardId);
    const cardElement = renderHandCard(cardData);
    userCardsContainer.appendChild(cardElement);
});

// Initial render
renderUserHand();
renderOpponentHand();
renderUserTable()
renderOpponentTable()
renderCardsToChoose(user.cardsToChoose);

document.getElementById('giveUpButton').addEventListener('click', () => {
    if (confirm("Are you sure you want to give up this battle?")) {
        Socket.destroyRoom(roomId);
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