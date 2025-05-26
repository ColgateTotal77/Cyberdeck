const Card = require('../models/Card.js');
const Socket = require('../Socket.js');
const User = require('../models/User.js');
const Game = require('../models/Game.js');

class APIController {
    constructor() {
        this.allCards = null;
    }

    async init() {
        this.allCards = await Card.takeAllCards();
        return this;
    }

    getAllCards(req, res) {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'No permission' });
        }
        res.json(this.allCards);
    }

    getBattleInfo(req, res) {
        if (!req.session || !req.session.user || !req.session.user.roomId || !Socket.battles.has(req.session.user.roomId)) {
            return res.status(401).json({ error: 'No battle info' });
        }
        let battle = structuredClone(Socket.battles.get(req.session.user.roomId));
        const userId = req.session.user.id;
        const opponent = battle.player1.userData.id !== userId ? 'player1' : 'player2';
        battle[opponent].mana = null;
        battle[opponent].handCards = battle[opponent].handCards.map(() => 0);
        res.json({battleInfo: battle, userId: userId});
    }

    async getAvatarPath(req, res) {
        const id = req.body.id;
        if (!id, !req.session || !req.session.user) {
            return res.status(401).json({ error: 'No user found' });
        }
        const userData = new User();
        await userData.find(id);
        res.json({"avatarPath": userData.avatar_path});
    }

    async getAllMatchHistory(req, res) {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'No user found' });
        }
        const userId = req.session.user.id;
        const allMatches = await Game.getAllMatches(userId);
        res.json({"allMatches": allMatches});
    }
}

module.exports = APIController;