const socket = io();

export function destroyRoom() { 
    socket.emit('destroyRoom');
}

socket.on('connect', () => {
    socket.emit('reconnectToRoom');
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