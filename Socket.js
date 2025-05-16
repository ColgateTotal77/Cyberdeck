const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');
const { RBTree } = require('bintrees');
const sharedsession = require("express-socket.io-session");

class Socket {
    static io = null;
    static waitingPlayers = new RBTree((a, b) => a.rating - b.rating);
    
    static inicialization(app, sessionMiddleware) {
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

        this.io.use(sharedsession(sessionMiddleware, {
            autoSave: true
        }));

        return server;
    }

    static process() {
        this.io.on('connection', (socket) => {
            console.log('A user connected:', socket.id);
            const user = socket.handshake.session.user;
            if (!user) return;

            user.socket_id = socket.id;
            console.log(user);

            socket.on('test', (data) => {
                console.log(`Test: ${socket.id} - ${data}`);
            });

            socket.on('findMatch', () => this.findMatch(socket));

            socket.on('disconnect', () => {
                console.log(socket.id, 'disconnect');
                const curRating = this.waitingPlayers.find({ rating: user.rating });
                deleteUserFromTree(this.waitingPlayers, curRating, socket.id);
            });
        });
    }

    static findMatch(socket) {
        const ratingBound = 300;
        const user = socket.handshake.session.user;

        if (!user) {
            console.log(`${socket.id} is not logged in`);
            return;
        }

        console.log(`${socket.id} is looking for a match`);

        let matched = false;

        if(!this.waitingPlayers.isEmpty()) {
            let curRating = this.waitingPlayers.find({ rating: user.rating });

            if(curRating) {
                const opponent = Object.values(curRating.players).at(-1);
                deleteUserFromTree(this.waitingPlayers, curRating, opponent.socket_id);
                matched = true;
                createRoom(this.io, socket, user, opponent);
                console.log(`${socket.id} matched with ${opponent.socket_id}`);
            } 
            else {
                const lower = this.waitingPlayers.lower({ rating: user.rating });
                const higher = this.waitingPlayers.upper({ rating: user.rating });

                const lowerDiff = lower?.rating !== undefined ? user.rating - lower.rating : null;
                const higherDiff = higher?.rating !== undefined ? higher.rating - user.rating : null;

                if (lowerDiff !== null && (higherDiff === null || lowerDiff < higherDiff) && lowerDiff < ratingBound) {
                    const opponent = Object.values(lower.players).at(-1);
                    deleteUserFromTree(this.waitingPlayers, lower, opponent.socket_id);
                    matched = true;
                    createRoom(this.io, socket, user, opponent);
                    console.log(`${socket.id} matched with ${opponent.socket_id}`);
                } else if (higherDiff !== null && (lowerDiff === null || higherDiff < lowerDiff) && higherDiff < ratingBound) {
                    const opponent = Object.values(higher.players).at(-1);
                    deleteUserFromTree(this.waitingPlayers, higher, opponent.socket_id);
                    matched = true;
                    createRoom(this.io, socket, user, opponent);
                    console.log(`${socket.id} matched with ${opponent.socket_id}`);
                }
            }
        }

        if (!matched) {
            console.log(`${socket.id} is waiting for an opponent...`);
            let node = this.waitingPlayers.find({ rating: user.rating });
            if (node) {
                node.players[socket.id] = user;
                this.waitingPlayers.remove(node);
                this.waitingPlayers.insert(node);
            } else {
                this.waitingPlayers.insert({ rating: user.rating, players: { [socket.id]: user } });
            }
        }
    }
}

function deleteUserFromTree(waitingPlayers, curRating, socket_id) {
    if (curRating) {
        delete curRating.players[socket_id];

        if (Object.keys(curRating.players).length) {
            waitingPlayers.remove(curRating);
            waitingPlayers.insert(curRating);
        } else {
            waitingPlayers.remove(curRating);
        }
    }
}

function createRoom(io, user_socket, user, opponent) {
    const roomId = `room-${user.socket_id}-${opponent.socket_id}`;
    
    const opponentSocket = io.sockets.sockets.get(opponent.socket_id);
    if (!opponentSocket) {
        console.warn(`Opponent socket not found: ${opponent.socket_id}`);
        return;
    }

    user_socket.join(roomId);
    opponentSocket.join(roomId);

    io.to(roomId).emit('startGame', {
        roomId,
        players: [user, opponent]
    });
}


module.exports = Socket;