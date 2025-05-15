const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');

class Socket {
    io = null;
    waitingPlayers = [];
    
    static inicialization(app) {
        let sslOptions = null;
        try {
            sslOptions = {
                key: fs.readFileSync(__dirname + '/ssl/key.pem'),
                cert: fs.readFileSync(__dirname + '/ssl/cert.pem')
            };
        } 
        catch (err) {
            console.error("Failed to load SSL certificate:", err.message);
            process.exit(1);
        }

        const server = https.createServer(sslOptions, app);
        this.io = new Server(server);

        return server;
    }

    static process() {
        this.io.on('connection', (socket) => {
            console.log('A user connected:', socket.id);

            socket.on('test', (data) => {
                console.log(`${socket.id} - ${data}`);
            });

            socket.on('disconnect', () => {
                console.log(socket.id, 'disconnect');
            });
        });
    }

    static findMatch() {
        socket.on('findMatch', (socket) => {
            
        })
    }
}

module.exports = Socket;