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

function renderUserHand() {
    user.handCards.forEach(cardId => {
        const cardData = allCards.find(card => card.id === cardId);
        if (cardData) {
            const cardElement = renderCard(cardData);
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
        const card = renderCard(cardData);
        userTable.appendChild(card); 
    });
}

            // Socket.socket.emit('cardAttack', {
            //     attackerInstanceId: selectedCardInstanceId,
            //     defenderInstanceId: card.instanceId,
            // });

function renderOpponentTable() {
    opponent.tableCards.forEach(cardData => {
        const card = renderCard(cardData);
        opponentTable.appendChild(card);
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

Socket.socket.on('cardPlaced', ({ by, cardId }) => {
    const cardData = allCards.find(card => card.id === cardId);
    if (!cardData) return;
    const cardElement = renderCard(cardData);
    if (by === user.userData.id) {
        const handCard = [...userCardsContainer.children].find(child =>
            child.dataset.cardId === String(cardId)
        );
        if (handCard) {
            handCard.remove();
        }
        userTable.appendChild(cardElement);
    } 
    else {
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

// Initial render
renderUserHand();
renderOpponentHand();
renderUserTable()
renderOpponentTable()

document.getElementById('giveUpButton').addEventListener('click', () => {
    if (confirm("Are you sure you want to give up this battle?")) {
        Socket.destroyRoom(roomId);
    }
})