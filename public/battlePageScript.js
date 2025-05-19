import { destroyRoom } from './battlePageClient.js'


const dataObj = await fetch('/api/getBattleInfo').then(res => res.json());
const allCards = await fetch('/api/getAllCards').then(res => res.json());

const battleInfo = dataObj.battleInfo;
const userId = dataObj.userId;
const roomId = battleInfo.roomId;
const user = battleInfo.player1.userData.id === userId ? battleInfo.player1 : battleInfo.player2;
const opponent = battleInfo.player2.userData.id === userId ? battleInfo.player1 : battleInfo.player2;
const current_turn_player_id = battleInfo.current_turn_player_id;

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
user.handCards.forEach(cardId => {
    const cardData = allCards.find(card => card.id === cardId);
    if (cardData) {
        const cardElement = renderCard(cardData);
        userCardsContainer.appendChild(cardElement);
    }
});

const opponentCardsContainer = document.getElementById('opponentHand');
opponent.handCards.forEach(() => {
    const cardBack = document.createElement('div');
    cardBack.classList.add('card-back');
    cardBack.innerHTML = `<img src="/image/cardBack.jpg" alt="cardBack" class="card-img" />`;
    opponentCardsContainer.appendChild(cardBack);
});

function renderCard(cardData) {
    const card = document.createElement('div');
    card.classList.add('card');

    card.innerHTML = `
        <img src="${cardData.image_url || '/image/exampleCard.png'}" alt="${cardData.name}" class="card-img" />
        <div class="card-name">${cardData.name}</div>
    `;
    return card;
}        

document.getElementById('giveUpButton').addEventListener('click', () => {
    if (confirm("Are you sure you want to give up this battle?")) {
        destroyRoom();
    }
})