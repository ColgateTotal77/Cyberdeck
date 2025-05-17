const Model = require('../model.js');

class Card extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "cards";
    }  
}

module.exports = Card;
