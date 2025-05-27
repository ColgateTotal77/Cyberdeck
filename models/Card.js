const Model = require('../model.js');
const db = require('../db.js');

class Card extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "cards";
    }
    
    static async takeAllCards() {
        const [rows] = await db.execute(`SELECT * FROM cards`);
        return rows.length > 0 ? rows : null;
    }

    static async takeAllCardsId() {
        const [rows] = await db.execute(`SELECT id FROM cards`);
        return rows.length > 0 ? new Set(rows.map(row => row.id)) : new Set();
    }
}

module.exports = Card;
