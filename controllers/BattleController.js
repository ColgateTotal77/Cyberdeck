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
}

module.exports = BattleController;