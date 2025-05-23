export class Socket {
    static socket = io();

    static giveUp() { 
        this.socket.emit('giveUp');
    }

    static endTurn(roomId) { 
        this.socket.emit('endTurn', roomId);
    }
}

Socket.socket.on('connect', () => {
    Socket.socket.emit('reconnectToRoom');
});

Socket.socket.on('userReconnected', ({ user }) => {
    console.log(`${user.login} has rejoined the room`);
});

Socket.socket.on('opponentDisconnected', () => {
    console.log('Your opponent has disconnected.');
});

Socket.socket.on('roomEnded', () => {
    console.log('Room has ended');
    window.location.href = `/mainPage`;
});