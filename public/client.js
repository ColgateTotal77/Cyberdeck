const socket = io();

export function testSocket() {
    // socket.emit('test', "Aboba");
    socket.emit('findMatch');
}

socket.on('connect', () => {
    socket.emit('reconnectToRoom');
});