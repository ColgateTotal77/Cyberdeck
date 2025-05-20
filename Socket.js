const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');
const { RBTree } = require('bintrees');
const sharedsession = require("express-socket.io-session");

const Game = require('./models/Game.js');
const Card = require('./models/Card.js');
const { Console } = require('console');

class Socket {
    static io = null;
    static waitingPlayers = new RBTree((a, b) => a.rating - b.rating);
    static rooms = new Map();
    static battles = new Map();
    static allCardsId = null;
    static allCards = null;
    static async loadCards() {
        this.allCardsId = await Card.takeAllCardsId();
        const rows = await Card.takeAllCards();
        const cardMap = new Map();
            for (const row of rows) {
                cardMap.set(row.id, row);
            }
        this.allCards = cardMap;
    }

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
        this.io.on('connection', async (socket) => {
            const user = socket.handshake.session?.user;
            if (!user) {
                console.log(`Socket ${socket.id} has no session user`);
                return;
            }

            socket.on('reconnectToRoom', () => this.reconnectToRoom(socket));

            user.socket_id = socket.id;

            console.log('A user connected:', user);

            socket.handshake.session.user.socket_id = socket.id;
            socket.handshake.session.save();

            socket.on('cardPlaced', (cardId) => this.cardPlaced(socket, cardId));

            socket.on('findMatch', (deck) => this.findMatch(socket, deck));
            socket.on('cardAttack', ({ attackerId, defenderId }) => this.cardAttack(socket, attackerInstanceId, defenderInstanceId));
            // Add handler for canceling match search
            socket.on('endTurn', () => this.endTurn(socket.handshake.session.user.roomId));
            socket.on('cancelMatch', () => this.cancelMatch(socket));
            
            socket.on('destroyRoom', () => this.destroyRoom(socket.handshake.session.user.roomId));
            socket.on('disconnect', () => {
                console.log(socket.id, 'disconnect');
                const user = socket.handshake.session.user;
                if (user?.roomId) {
                    socket.to(user.roomId).emit('opponentDisconnected');
                }
                const curRating = this.waitingPlayers.find({ rating: user.rating });
                this.deleteUserFromTree(curRating, socket.id);
            });
        });
    }

    static cancelMatch(socket) {
        const user = socket.handshake.session.user;
        if (!user) {
            console.log(`${socket.id} is not logged in`);
            return;
        }

        console.log(`${socket.id} canceled match search`);
        
        const curRating = this.waitingPlayers.find({ rating: user.rating });
        this.deleteUserFromTree(curRating, socket.id);
        
        socket.emit('matchCancelled');
    }

    static findMatch(socket, deck) {
        const ratingBound = 300;
        const user = socket.handshake.session.user;

        if (!user) {
            console.log(`${socket.id} is not logged in`);
            return;
        }

        console.log(deck);

        if(!checkDeckBeforeStart(deck, this.allCardsId)) {
            console.log("deck problems, matchCancelled");
            socket.emit('matchCancelled');
            return;
        }
        
        socket.handshake.session.deck = deck;
        socket.handshake.session.save();

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
                } 
                else if (higherDiff !== null && (lowerDiff === null || higherDiff < lowerDiff) && higherDiff < ratingBound) {
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
            } 
            else {
                this.waitingPlayers.insert({ rating: user.rating, players: { [socket.id]: user } });
            }
        }
    }

    static async createRoom(user_socket, opponent) {
        const user = user_socket.handshake.session.user;
        const opponentSocket = this.io.sockets.sockets.get(opponent.socket_id);
        if (!opponentSocket) {
            console.warn(`Opponent socket not found: ${opponent.socket_id}`);
            return;
        }

        const roomId = `room-${user.socket_id}-${opponent.socket_id}`;

        user_socket.join(roomId);
        opponentSocket.join(roomId);

        const game = await new Game({player1_id: user.id, player2_id: opponentSocket.handshake.session.user.id}).save();

        const current_turn_player_id = Math.random() < 0.5 ? user.id : opponentSocket.handshake.session.user.id;

        this.rooms.set(roomId, {
            player1_id: user.id,
            player2_id: opponent.id,
            gameId: game.id
        });

        const userDeck = [...user_socket.handshake.session.deck].sort(() => 0.5 - Math.random());
        const opponentDeck = [...opponentSocket.handshake.session.deck].sort(() => 0.5 - Math.random());
        const userHandCards = userDeck.slice(0, 4);
        const opponentHandCards = opponentDeck.slice(0, 4);

        this.battles.set(roomId, {
            player1: {userData: user, hp:30, mana: 4, handCards: userHandCards, tableCards: [], deck: userDeck},
            player2: {userData: opponent, hp:30, mana: 4, handCards: opponentHandCards, tableCards: [], deck: opponentDeck},
            roomId: roomId,
            current_turn_player_id : current_turn_player_id
        });
        
        user_socket.handshake.session.user.roomId = roomId;
        user_socket.handshake.session.save();
        opponentSocket.handshake.session.user.roomId = roomId;
        opponentSocket.handshake.session.save();

        this.io.to(roomId).emit('startGame', roomId);
        this.startTurn(roomId);
    }

    static reconnectToRoom(socket) {
        const user = socket.handshake.session.user;
        if (user && user.roomId) {
            socket.join(user.roomId);
            this.io.to(user.roomId).emit('userReconnected', { user });
            console.log(`${user.login} rejoined ${user.roomId}`);
        }
    }

    static cardPlaced(socket, cardId) {
        console.log("!")
        const user = socket.handshake.session.user;
        const roomId = user.roomId;
        if (!user || !cardId){
            console.log("!user || !cardId");
            return;
        }

        cardId = Number(cardId);
        const battle = this.battles.get(roomId);
        const who = battle.player1.userData.id === user.id ? 'player1' : 'player2';

        if (battle.current_turn_player_id !== user.id){ 
            console.log("Not this player's turn");
            return;
        }

        const cardIndex = battle[who].handCards.indexOf(cardId);
        console.log(battle[who].handCards);
        console.log(cardId);
        if (cardIndex === -1) {
            console.log("cardIndex === -1");
            return;
        }
        battle[who].handCards.splice(cardIndex, 1);
        let cardToPush = this.allCards.get(cardId);
        cardToPush.instanceId = Math.random().toString(36).substr(2, 9);
        battle[who].tableCards.push(this.allCards.get(cardId));
        this.battles.set(roomId, battle);
        console.log("send!")
        this.io.to(roomId).emit('cardPlaced', {
            by: user.id,
            cardId: cardId
        });
        console.log("send!!!!")
    }

static startTurn(roomId) {
    const room = this.rooms.get(roomId);
    const playerId = this.battles.get(roomId).current_turn_player_id;

    this.io.to(roomId).emit("turnStarted", {
        currentPlayerId: playerId,
        timeLimit: 30 
    });
    console.log("turn started!");
    room.turnTimeout = setTimeout(() => {
        this.endTurn(roomId);
    }, 30000);   
}

static endTurn(roomId) {
    const room = this.rooms.get(roomId);
    clearTimeout(room.turnTimeout);

    const battle = this.battles.get(roomId);
    const nextPlayerId = battle.player1.userData.id === battle.current_turn_player_id ? battle.player2.userData.id : battle.player1.userData.id;

    battle.current_turn_player_id = nextPlayerId;
    this.startTurn(roomId);
}

static cardAttack(socket, attackerInstanceId, defenderInstanceId) {
    const user = socket.handshake.session.user;
    const roomId = user.roomId;

    if (!user || !roomId) {
        console.log("!user || !roomId");
        return;
    }

    const battle = this.battles.get(roomId);
    if (!battle) {
        console.log("Battle not found");
        return;
    }

    if (battle.current_turn_player_id !== user.id) {
        console.log("Not this player's turn");
        return;
    }

    const attackerPlayer = battle.player1.userData.id === user.id ? 'player1' : 'player2';
    const defenderPlayer = attackerPlayer === 'player1' ? 'player2' : 'player1';

    const attackerCard = battle[attackerPlayer].tableCards.find(card => card.instanceId === attackerInstanceId);
    const defenderCard = battle[defenderPlayer].tableCards.find(card => card.instanceId === defenderInstanceId);

    if (!attackerCard || !defenderCard) {
        console.log("Attacker or defender card not found");
        return;
    }

    defenderCard.hp -= attackerCard.attack;

    if (defenderCard.hp <= 0) {
        thisbattle[defenderPlayer].tableCards = battle[defenderPlayer].tableCards.filter(card => card.instanceId !== defenderInstanceId);
    }

    this.battles.set(roomId, battle);

    this.io.to(roomId).emit('attackResult', {
        attackerInstanceId,
        defenderInstanceId,
        newDefenderHp: defenderCard.hp,
        isDefenderDead: defenderCard.hp <= 0,
        by: user.id
    });
}


    static deleteUserFromTree(curRating, socket_id) {
        if (curRating) {
            delete curRating.players[socket_id];

            if (Object.keys(curRating.players).length) {
                this.waitingPlayers.remove(curRating);
                this.waitingPlayers.insert(curRating);
            } 
            else {
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

        Game.setEndTime(this.rooms.get(roomId).gameId);

        this.rooms.delete(roomId);
        this.battles.delete(roomId);
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

function checkDeckBeforeStart(deck, allCardsId) {
    let deckSet = new Set(deck);
    if(deckSet.size !== 12) {
        return false;
    }

    for (const value of deckSet) {
        if(!allCardsId.has(value)) {
            return false;
        }
    }
    return true;
}

module.exports = Socket;

//need:
//check rating before start match
//update rating after match
//