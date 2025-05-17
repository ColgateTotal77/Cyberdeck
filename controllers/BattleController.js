const Socket = require('../Socket.js');
const path = require('path');

class BattleController {

    static BattlePage(req, res) {
        const roomId = req.params.roomId;
        const user = req.session.user;

        if(!user || !Socket.rooms.has(roomId) || user.roomId != roomId) {
            res.redirect('/mainPage');
        }
        else {
            res.sendFile(path.join(__dirname, "../views/battlePage.html"));
        }
    }

    static battleInfo(req, res) {
        if (!req.session || !req.session.user || !req.session.user.roomId || !Socket.battles.has(req.session.user.roomId)) {
            return res.status(401).json({ error: 'No battle info' });
        }
        res.json({battleInfo: Socket.battles.get(req.session.user.roomId), userId: req.session.user.id});
    }
}

module.exports = BattleController;