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

Socket.socket.on('roomEnded', () => {
    window.location.href = `/mainPage`;
});