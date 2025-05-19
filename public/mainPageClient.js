import { showSearchingIndicator } from './mainPageScript.js';

const socket = io();

export function testSocket() {
    socket.emit('findMatch');
}

socket.on('connect', () => {
    socket.emit('reconnectToRoom');
});

export function cancelMatch() {
    socket.emit('cancelMatch');
}

socket.on('startGame', async (roomId) => {
    window.location.href = `/battle/${roomId}`;
});

socket.on('matchCancelled', () => {
    console.log('Match search cancelled');
    showSearchingIndicator(false);
});

import { CardStore } from './CardStore.js';

socket.on('allCards', (allCards) => {
    CardStore.setCards(allCards);
});