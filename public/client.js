const socket = io();

export function testSocket() {
    socket.emit('test', "Aboba");
}
