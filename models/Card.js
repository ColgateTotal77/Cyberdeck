const Model = require('../model.js');
const db = require('../db.js');

class Card extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "cards";
    }
    
    static async takeAllCards() {
        const [rows] = await db.execute(`SELECT * FROM cards`);
        if (rows.length > 0) {
            return rows;
        } 
        else {
            return null;
        }
    }
}

module.exports = Card;
