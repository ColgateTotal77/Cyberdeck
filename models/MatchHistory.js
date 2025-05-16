const Model = require('../model.js');

class MatchHistory extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "MatchHistory";
    }  

    async takeFullMatchHistory(fields, data) {
        const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE ${fields} = ?`, data);

        if (rows.length > 0) {
            return rows;
        } 
        else {
            return null;
        }
    }

}

// matchHistory = new MatchHistory();
// matchHistory.findByField("player1_id = ? OR player2_id", user.id);

module.exports = MatchHistory;