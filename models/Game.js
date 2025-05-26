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

    static async getAllMatches (userId) {
        const [rows] = await db.execute(`        
        SELECT 
            u.login AS opponent_login,
            g.start_time,
            g.end_time,
            CASE 
                WHEN g.winner_id = ? THEN g.rating_for_winner
                ELSE g.rating_for_loser
            END AS rating_change
        FROM games g
        JOIN users u 
            ON (
                CASE 
                    WHEN g.player1_id = ? THEN g.player2_id = u.id
                    ELSE g.player1_id = u.id
                END
            )
        WHERE g.player1_id = ? OR g.player2_id = ?
        ORDER BY g.start_time DESC
        LIMIT 20;`, [userId, userId, userId, userId]);

        if (rows.length > 0) {
            return rows;
        } 
        else {
            return null;
        }
    }
}

module.exports = Game;
