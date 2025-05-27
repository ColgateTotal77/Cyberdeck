const http = require('http');
const { Server } = require('socket.io');
const { RBTree } = require('bintrees');
const sharedsession = require("express-socket.io-session");

const Game = require('./models/Game.js');
const Card = require('./models/Card.js');
const User = require('./models/User.js');

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
        const server = http.createServer(app);
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

            console.log('A user connected:', user.login);

            socket.handshake.session.user.socket_id = socket.id;
            socket.handshake.session.save();

            socket.on('findMatch', (deck) => this.findMatch(socket, deck));

            socket.on('cardPlaced', (cardId) => this.cardPlaced(socket, cardId));
            socket.on('cardAttack', ({ attackerInstanceId, defenderInstanceId }) => this.cardAttack(socket, attackerInstanceId, defenderInstanceId));
            socket.on('opponentAttacked', (cardId) => this.opponentAttacked(socket, cardId));
            socket.on('choosenCard', (cardId) => this.choosenCard(socket, cardId));
            socket.on('giveRandomCard', () => this.giveRandomCard(socket));
            socket.on('endTurn', (roomId) => {
                const battle = this.battles.get(roomId);
                if(battle && socket.handshake.session.user.id === battle.current_turn_player_id) {
                    this.endTurn(roomId);
                }
                else {
                    socket.emit("notification", { message: "Not your turn", isError: true });
                }
            });

            socket.on('cancelMatch', () => this.cancelMatch(socket));
            
            socket.on('giveUp', () => this.giveUp(socket));
            socket.on('disconnect', () => {
                console.log(socket.id, 'disconnect');
                const user = socket.handshake.session.user;
                if (user?.roomId) {
                    const room = this.rooms.get(user.roomId);
                    if (room) {
                        room.socketIds = room.socketIds.filter(id => id !== socket.id);
                        socket.to(user.roomId).emit('opponentDisconnected');
                    }
                }

                const curRating = this.waitingPlayers.find({ rating: user?.rating });
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

        if(!checkDeckBeforeStart(deck, this.allCardsId)) {
            console.log("deck problems, matchCancelled");
            socket.emit('matchCancelled');
            socket.emit("notification", { message: "Fill in the deck", isError: false });
            return;
        }
        
        socket.handshake.session.deck = deck;
        socket.handshake.session.save();

        console.log(`${socket.id} is looking for a match`);
        let matched = false;

        if(this.waitingPlayers.size > 0) {
            let curRating = this.waitingPlayers.find({ rating: user.rating });

            if(curRating) {
                const availableOpponents = Object.values(curRating.players).filter(player => player.id !== user.id);
                if(availableOpponents.length > 0) {
                    const opponent = availableOpponents.at(-1);
                    this.deleteUserFromTree(curRating, opponent.socket_id);
                    matched = true;
                    this.createRoom(socket, opponent);
                    console.log(`${socket.id} matched with ${opponent.socket_id}`);
                }
            } 
            
            if(!matched) {
                const { lower, higher } = this.getClosestOpponents(user.rating, user.id);
                
                const lowerDiff = lower?.rating !== undefined ? user.rating - lower.rating : null;
                const higherDiff = higher?.rating !== undefined ? higher.rating - user.rating : null;
                
                if (lowerDiff !== null && (higherDiff === null || lowerDiff < higherDiff) && lowerDiff < ratingBound) {
                    const availableOpponents = Object.values(lower.players).filter(player => player.id !== user.id);
                    if(availableOpponents.length > 0) {
                        const opponent = availableOpponents.at(-1);
                        this.deleteUserFromTree(lower, opponent.socket_id);
                        matched = true;
                        this.createRoom(socket, opponent);
                        console.log(`${socket.id} matched with ${opponent.socket_id}`);
                    }
                } 
                else if (higherDiff !== null && (lowerDiff === null || higherDiff < lowerDiff) && higherDiff < ratingBound) {
                    const availableOpponents = Object.values(higher.players).filter(player => player.id !== user.id);
                    if(availableOpponents.length > 0) {
                        const opponent = availableOpponents.at(-1);
                        this.deleteUserFromTree(higher, opponent.socket_id);
                        matched = true;
                        this.createRoom(socket, opponent);
                        console.log(`${socket.id} matched with ${opponent.socket_id}`);
                    }
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

    static getClosestOpponents(rating, excludeUserId) {
        let iter = this.waitingPlayers.iterator(), node;
        let lower = null, higher = null;

        while ((node = iter.next()) !== null) {
            const availablePlayers = Object.values(node.players).filter(player => player.id !== excludeUserId);
            if(availablePlayers.length === 0) {
                continue; 
            }

            if (node.rating <= rating) {
                if (!lower || node.rating > lower.rating) lower = node;
            } 
            else {
                if (!higher || node.rating < higher.rating) higher = node;
            }
        }

        return { lower, higher };
    }

    static async createRoom(user_socket, opponent) {
        const user = user_socket.handshake.session.user;
        const opponentSocket = this.io.sockets.sockets.get(opponent.socket_id);
        if (!opponentSocket) {
            console.warn(`Opponent socket not found: ${opponent.socket_id}`);
            this.findMatch(user_socket, user_socket.handshake.session.deck);
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
            gameId: game.id,
            turn: 0,
            socketIds: [user_socket.id ,opponent.socket_id]
        });

        const userDeck = [...user_socket.handshake.session.deck].sort(() => 0.5 - Math.random());
        const opponentDeck = [...opponentSocket.handshake.session.deck].sort(() => 0.5 - Math.random());
        const userHandCards = userDeck.slice(0, 4);
        const opponentHandCards = opponentDeck.slice(0, 4);

        this.battles.set(roomId, {
            player1: {userData: user, hp:30, mana: 4, handCards: userHandCards, tableCards: [], deck: userDeck, cardsToChoose: []},
            player2: {userData: opponent, hp:30, mana: 4, handCards: opponentHandCards, tableCards: [], deck: opponentDeck, cardsToChoose: []},
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
            if(this.rooms.has(user.roomId)) {
                socket.join(user.roomId);
                const room = this.rooms.get(user.roomId);
                room.socketIds.push(socket.id);
                console.log(`${user.login} rejoined ${user.roomId}`);
            }
        }
    }

    static cardPlaced(socket, cardId) {
        const user = socket.handshake.session.user;
        const roomId = user.roomId;
        if (!user || !cardId){
            console.log("!user || !cardId");
            socket.emit("notification", { message: "Card is not found", isError: true });
            return;
        }
        const battle = this.battles.get(roomId);
        if(!battle) {
            console.log("battle is undefined")
            return;
        }

        const who = battle.player1.userData.id === user.id ? 'player1' : 'player2';

        if (battle.current_turn_player_id !== user.id){ 
            console.log("Not this player's turn");
            socket.emit("notification", { message: "Not your turn", isError: true });
            return;
        }

        if(battle[who].tableCards.length >= 6) {
            socket.emit("notification", { message: "Maximum number of cards is placed on the table", isError: true });
            return;
        }

        const cardIndex = battle[who].handCards.indexOf(cardId);
        if (cardIndex === -1) {
            console.log("cardIndex === -1");
            socket.emit("notification", { message: "Card is not found", isError: true });
            return;
        }
        const card = this.allCards.get(cardId);
        const newMana = battle[who].mana - card.cost;
        if(newMana < 0) {
            socket.emit("notification", { message: "Not enough mana", isError: true });
            return;
        }

        battle[who].handCards.splice(cardIndex, 1);
        let cardToPush = Object.assign({}, card);
        cardToPush.canAttack = true;
        const cardInstanceId = Math.random().toString(36).substr(2, 9)
        cardToPush.instanceId = cardInstanceId;
        battle[who].tableCards.push(cardToPush);
        battle[who].mana = newMana;
        // this.battles.set(roomId, battle);
        this.io.to(roomId).emit('cardPlaced', {
            by: user.id,
            cardId: cardId,
            cardInstanceId: cardInstanceId,
        });

        socket.emit("newMana", newMana);
    }

    static startTurn(roomId) {
        const room = this.rooms.get(roomId);
        const battle = this.battles.get(roomId);

        if(!battle || !room) {
            console.log("battle not found");
            return;
        }

        const playerId = battle.current_turn_player_id;
        const who = battle.player1.userData.id === playerId ? 'player1' : 'player2';

        battle[who].tableCards.forEach(card => {
            card.canAttack = true;
        });

        let userSocket = null;
        let opponentSocket = null;
        for (const socketId of room.socketIds) {
            let socket = this.io.sockets.sockets.get(socketId);
            if(socket) {
                if (socket?.handshake.session.user.id === playerId) {
                    userSocket = socket;
                }
                else {
                    opponentSocket = socket;
                }
            }
        }

        room.turn++;

        if(room.turn > 2 && userSocket && opponentSocket && battle[who].handCards.length < 6) {
            const arrayLen = (battle[who].cardsToChoose).length;
            if(arrayLen > 0) {
                const newRandomCardID = battle[who].cardsToChoose[Math.floor(Math.random() * arrayLen)]
                battle[who].handCards.push(newRandomCardID);
                userSocket.emit("newHandCard", newRandomCardID);
                opponentSocket.emit("newOpponentHandCard");
                battle[who].cardsToChoose = [];
            }
            if(battle[who].handCards.length < 6 ) {
                const cardsToChoose = [...battle[who].deck].sort(() => 0.5 - Math.random()).slice(0, 3);
                battle[who].cardsToChoose = cardsToChoose;
                userSocket.emit("newCards", cardsToChoose);
            }

            const supposeMana = battle[who].mana + Math.floor(room.turn / 2) + 4;
            battle[who].mana = supposeMana > 10 ? 10 : supposeMana;
            userSocket.emit("newMana", battle[who].mana);     
        }

        this.io.to(roomId).emit("turnStarted", {
            currentPlayerId: playerId,
            timeLimit: 30, 
        });

        console.log("turn started!");

        if (room.turnTimeout) {
            clearTimeout(room.turnTimeout);
        }

        room.turnTimeout = setTimeout(() => {
            this.endTurn(roomId);
        }, 30000);   
    }

    static choosenCard(socket, cardId) {
        const user = socket.handshake.session.user

        if(!user) {
            console.log("user not found");
            return;
        }

        const roomId = user.roomId;
        const room = this.rooms.get(roomId);
        const battle = this.battles.get(roomId);

        if(!battle || !room) {
            return;
        }

        const who = battle.player1.userData.id === user.id ? 'player1' : 'player2';

        if(battle[who].cardsToChoose.includes(cardId)) {
            console.log("choosenCard");
            battle[who].cardsToChoose = [];
            battle[who].handCards.push(cardId);
            socket.emit("newHandCard", cardId);
            const opponentSocketId = room.socketIds.find(socketId => socketId !== socket.id);
            if (opponentSocketId) {
                this.io.to(opponentSocketId).emit("newOpponentHandCard");
            }
        }
    }

    static endTurn(roomId) {
        const room = this.rooms.get(roomId);
        const battle = this.battles.get(roomId);

        if(!battle || !room) {
            return;
        }

        clearTimeout(room.turnTimeout);
        const nextPlayerId = battle.player1.userData.id === battle.current_turn_player_id ? battle.player2.userData.id : battle.player1.userData.id;

        battle.current_turn_player_id = nextPlayerId;
        this.startTurn(roomId);
    }

    static giveRandomCard(socket) {
        const user = socket.handshake.session.user

        if(!user) {
            console.log("user not found");
            return;
        }

        const roomId = user.roomId;
        const room = this.rooms.get(roomId);
        const battle = this.battles.get(roomId);

        if(!battle || !room) {
            return;
        }

        if (battle.current_turn_player_id !== user.id){ 
            console.log("Not this player's turn");
            socket.emit("notification", { message: "Not your turn", isError: true });
            return;
        }

        const who = battle.player1.userData.id === user.id ? 'player1' : 'player2';

        if(battle[who].handCards.length >= 6 ) {
            socket.emit("notification", { message: "Maximum number of cards in your hands", isError: true });
            return;
        }

        if(battle[who].mana < 3) {
            socket.emit("notification", { message: "Not enough mana", isError: true });
            return;
        }

        battle[who].mana -= 3;
        const newRandomCardID = battle[who].deck[Math.floor(Math.random() * battle[who].deck.length)];
        battle[who].handCards.push(newRandomCardID);

        socket.emit("newMana", battle[who].mana);
        socket.emit("newHandCard", newRandomCardID);

        const opponentSocketId = room.socketIds.find(socketId => socketId !== socket.id);
        if (opponentSocketId) {
            this.io.to(opponentSocketId).emit("newOpponentHandCard");
        }
    }

    static cardAttack(socket, attackerInstanceId, defenderInstanceId) {
        const user = socket.handshake.session.user;
        const roomId = user.roomId;
        console.log("cardAttack");
        if (!user || !roomId) {
            console.log("!user || !roomId");
            return;
        }

        const battle = this.battles.get(roomId);
        if (!battle) {
            return;
        }

        if (battle.current_turn_player_id !== user.id) {
            console.log("Not your turn");
            return;
        }

        const attackerPlayer = battle.player1.userData.id === user.id ? 'player1' : 'player2';
        const defenderPlayer = attackerPlayer === 'player1' ? 'player2' : 'player1';

        const attackerCard = battle[attackerPlayer].tableCards.find(card => card.instanceId === attackerInstanceId);
        const defenderCard = battle[defenderPlayer].tableCards.find(card => card.instanceId === defenderInstanceId);

        if (!attackerCard || !defenderCard) {
            console.log("!attackerCard || !defenderCard");
            socket.emit("notification", { message: "Cards not found", isError: true });
            return;
        }

        if(!attackerCard.canAttack) {
            socket.emit("notification", { message: "Card has already attacked!", isError: true });
            return;
        }
        attackerCard.canAttack = false;

        defenderCard.hp -= attackerCard.attack;

        if (defenderCard.hp <= 0) {
            battle[defenderPlayer].tableCards = battle[defenderPlayer].tableCards.filter(card => card.instanceId !== defenderInstanceId);
        }

        this.io.to(roomId).emit('attackResult', {
            attackerInstanceId,
            defenderInstanceId,
            newDefenderHp: defenderCard.hp,
            isDefenderDead: defenderCard.hp <= 0,
            by: user.id
        });
    }

    static opponentAttacked(socket, cardInstanceId) {
        const user = socket.handshake.session.user;
        const roomId = user.roomId;
        if (!user || !roomId) {
            return;
        }

        const battle = this.battles.get(roomId);
        if (!battle) {
            return;
        }

        if (battle.current_turn_player_id !== user.id) {
            socket.emit("notification", { message: "Not your turn", isError: true });
            return;
        }

        const player1 = battle.player1.userData.id === user.id ? 'player1' : 'player2';
        const player2 = battle.player1.userData.id !== user.id ? 'player1' : 'player2';

        const card = battle[player1].tableCards.find(card => card.instanceId === cardInstanceId);

        if(card) {
            if(!card.canAttack) {
                socket.emit("notification", { message: "Card has already attacked!", isError: true });
                return;
            }
            card.canAttack = false;
            
            let hpRest = battle[player2].hp - card.attack;
            hpRest = hpRest < 0 ? 0 : hpRest;
            battle[player2].hp = hpRest;
            this.io.to(roomId).emit('userHpDecrease', {defeanserId: battle[player2].userData.id, newHp: hpRest});
         
            if(hpRest <= 0) {
                this.matchEnded(roomId, battle[player1].userData, battle[player2].userData);
            }
        }
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

    static giveUp(socket) {
        const user = socket.handshake.session.user;
        const roomId = user.roomId;
        if (!user){
            console.log("!user");
            return;
        }
        const battle = this.battles.get(roomId);
        if(!battle) {
            return;
        }

        const player1 = battle.player1.userData.id === user.id ? 'player1' : 'player2';
        const player2 = battle.player1.userData.id !== user.id ? 'player1' : 'player2';


        this.matchEnded(roomId, battle[player2].userData, battle[player1].userData);
    }

    static async matchEnded(roomId, winner, loser) {
        const winnerData = new User();
        await winnerData.find(winner.id);

        const loserData = new User();
        await loserData.find(loser.id);

        const ratingForWinner = calculateRatingChange(winnerData.rating, loserData.rating, true);
        const ratingForLoser = calculateRatingChange(loserData.rating, winnerData.rating, false);

        this.io.to(roomId).emit('matchEnded', {
            winnerData: { userId: winner.id, plusRating: ratingForWinner }, 
            loserData: { userId: loser.id, plusRating: ratingForLoser }
        });  

        const newWinnerRating = winnerData.rating + ratingForWinner;
        winnerData.rating = newWinnerRating;
        await winnerData.save();

        const newLoserRating = loserData.rating + ratingForLoser;
        loserData.rating = newLoserRating < 1 ? 1 : newLoserRating;
        await loserData.save();

        this.destroyRoom(roomId, winner.id, ratingForWinner, ratingForLoser);
    }

    static destroyRoom(roomId, winnerId, newWinnerRating, newLoserRating) {
        console.log("destroyRoom");
        const roomSocket = this.io.sockets.adapter.rooms.get(roomId);
        const room = this.rooms.get(roomId);

        if (!roomSocket || !room) {
            console.warn(`No room found with ID ${roomId}`);
            return;
        }

        for (const socketId of roomSocket) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket) continue;

            const user = socket.handshake.session?.user;
            if (user) {
                if (user.id === winnerId) {
                    user.rating = newWinnerRating;
                } else {
                    user.rating = newLoserRating;
                }
                
                delete user.roomId;
                socket.handshake.session.save();
            }
            socket.leave(roomId);
        }

        Game.setEndGame(room.gameId, winnerId, newWinnerRating, newLoserRating);
        this.io.to(roomId).socketsLeave(roomId); 
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
    // const randFactor = Math.random() * 2 + 1;
    // const totalChange = baseChange * randFactor;

    return Math.round(baseChange);
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
