const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');
const { RBTree } = require('bintrees');
const sharedsession = require("express-socket.io-session");
const MatchHistory = require('./models/MatchHistory.js');

class Socket {
    static io = null;
    static waitingPlayers = new RBTree((a, b) => a.rating - b.rating);
    static rooms = new Map();

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
            const user = socket.handshake.session?.user;
            if (!user) {
                console.log(`Socket ${socket.id} has no session user`);
                return;
            }
            
            socket.on('reconnectToRoom', () => this.reconnectToRoom(socket));

            user.socket_id = socket.id;

            console.log('A user connected:', user);

            socket.handshake.session.user.socket_id = socket.id;

            socket.on('test', (data) => {
                
            });

            socket.on('findMatch', () => this.findMatch(socket));

            socket.on('disconnect', () => {
                console.log(socket.id, 'disconnect');
                if (user?.roomId) {
                    socket.to(user.roomId).emit('opponentDisconnected');
                }
                const curRating = this.waitingPlayers.find({ rating: user.rating });
                this.deleteUserFromTree(curRating, socket.id);
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

        if(this.waitingPlayers.size > 0) {
            let curRating = this.waitingPlayers.find({ rating: user.rating });

            if(curRating) {
                const opponent = Object.values(curRating.players).at(-1);
                this.deleteUserFromTree(curRating, opponent.socket_id);
                matched = true;
                this.createRoom(socket, opponent);
                console.log(`${socket.id} matched with ${opponent.socket_id}`);
            } 
            else {
                const lower = this.waitingPlayers.lower({ rating: user.rating });
                const higher = this.waitingPlayers.upper({ rating: user.rating });

                const lowerDiff = lower?.rating !== undefined ? user.rating - lower.rating : null;
                const higherDiff = higher?.rating !== undefined ? higher.rating - user.rating : null;

                if (lowerDiff !== null && (higherDiff === null || lowerDiff < higherDiff) && lowerDiff < ratingBound) {
                    const opponent = Object.values(lower.players).at(-1);
                    this.deleteUserFromTree(lower, opponent.socket_id);
                    matched = true;
                    this.createRoom(socket, opponent);
                    console.log(`${socket.id} matched with ${opponent.socket_id}`);
                } else if (higherDiff !== null && (lowerDiff === null || higherDiff < lowerDiff) && higherDiff < ratingBound) {
                    const opponent = Object.values(higher.players).at(-1);
                    this.deleteUserFromTree(higher, opponent.socket_id);
                    matched = true;
                    this.createRoom(socket, opponent);
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

    static createRoom(user_socket, opponent) {
        const user = user_socket.handshake.session.user;
        console.log(opponent);
        const opponentSocket = this.io.sockets.sockets.get(opponent.socket_id);
        if (!opponentSocket) {
            console.warn(`Opponent socket not found: ${opponent.socket_id}`);
            return;
        }

        const roomId = `room-${user.socket_id}-${opponent.socket_id}`;

        user_socket.join(roomId);
        opponentSocket.join(roomId);

        user.roomId = roomId;
        user_socket.handshake.session.user.roomId = roomId;
        user_socket.handshake.session.save();

        opponent.roomId = roomId;
        opponentSocket.handshake.session.user.roomId = roomId;
        opponentSocket.handshake.session.save();

        this.io.to(roomId).emit('startGame', {
            roomId,
            players: [user, opponent]
        });

        this.rooms.set(roomId, {
            startTime: new Date(),
            player1_id: user.id,
            player2_id: opponent.id,
        });
        //player1_rating
        //player2_rating
        //who win
        //endTime
    }

    static reconnectToRoom(socket) {
        const user = socket.handshake.session.user;
        if (user && user.roomId) {
            socket.join(user.roomId);
            this.io.to(user.roomId).emit('userReconnected', { user });
            console.log(`${user.login} rejoined ${user.roomId}`);
        }
    }

    static deleteUserFromTree(curRating, socket_id) {
        if (curRating) {
            delete curRating.players[socket_id];

            if (Object.keys(curRating.players).length) {
                this.waitingPlayers.remove(curRating);
                this.waitingPlayers.insert(curRating);
            } else {
                this.waitingPlayers.remove(curRating);
            }
        }
    }

    static destroyRoom(roomId) {
        const roomSocket = this.io.sockets.adapter.rooms.get(roomId);
        if (!roomSocket) {
            console.warn(`No room found with ID ${roomId}`);
            return;
        }

        for (const socketId of roomSocket) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket) continue;

            const user = socket.handshake.session?.user;
            if (user) {
                delete user.roomId;
                socket.handshake.session.save();
            }
            socket.leave(roomId);
            socket.emit('roomEnded');
        }
        console.log(`${roomId} has been closed.`);
    }
}

function calculateRatingChange(userRating, opponentRating, didWin) {
    const result = didWin ? 1 : 0;
    const k = 30;
    const expected = 1 / (1 + Math.pow(10, (opponentRating - userRating) / 400));
    const baseChange = k * (result - expected);
    const randFactor = Math.random() * 2 + 1;
    const totalChange = baseChange * randFactor;

    return Math.round(totalChange);
}

//startGame
//userReconnected
//roomEnded

module.exports = Socket;