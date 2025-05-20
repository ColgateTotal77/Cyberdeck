export class Socket {
    static socket = io();

    static destroyRoom() { 
        this.socket.emit('destroyRoom');
    }

    static endTurn() { 
        this.socket.emit('endTurn');
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