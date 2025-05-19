import { showSearchingIndicator } from './mainPageScript.js';

const socket = io();

export function startFindOpponent(deck) {
    socket.emit('findMatch', deck);
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