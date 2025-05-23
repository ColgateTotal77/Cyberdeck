const Model = require('../model.js');
const db = require('../db.js');

class Game extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "games";
    }

    static async setEndGame(id, winnerId, ratingForWinner, ratingForloser) {
        try {
            await db.query("UPDATE games SET end_time = NOW(), winner_id = ?, rating_for_winner = ?, rating_for_loser = ? WHERE id = ?", [winnerId, ratingForWinner, ratingForloser, id]);
        } 
        catch (err) {
            console.error(`Failed to update end_time for game ${id}:`, err);
        }
    }
}

module.exports = Game;
