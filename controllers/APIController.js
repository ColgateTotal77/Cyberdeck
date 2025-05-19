const Card = require('../models/Card.js');
const Socket = require('../Socket.js');

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
        res.json({battleInfo: Socket.battles.get(req.session.user.roomId), userId: req.session.user.id});
    }
}

module.exports = APIController;