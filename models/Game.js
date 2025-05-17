const Model = require('../model.js');
const db = require('../db.js');

class Game extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "games";
    }

    static async setEndTime(id) {
        try {
            await db.query("UPDATE games SET end_time = NOW() WHERE id = ?", [id]);
        } 
        catch (err) {
            console.error(`Failed to update end_time for game ${id}:`, err);
        }
    }
}

module.exports = Game;
