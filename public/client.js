const socket = io();

export function testSocket() {
    socket.emit('findMatch');
}

export function destroyRoom() { //temporary
    socket.emit('destroyRoom');
}

socket.on('connect', () => {
    socket.emit('reconnectToRoom');
});

socket.on('startGame', async (roomId) => {
    window.location.href = `/battle/${roomId}`;
});

socket.on('userReconnected', ({ user }) => {
    console.log(`${user.login} has rejoined the room`);
});

socket.on('opponentDisconnected', () => {
    console.log('Your opponent has disconnected.');
});

socket.on('roomEnded', () => {
    console.log('Room has ended');
    window.location.href = `/mainPage`;
});

import { CardStore } from './CardStore.js';

socket.on('allCards', (allCards) => {
    CardStore.setCards(allCards);
});