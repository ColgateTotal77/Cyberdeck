const Model = require('../model.js');

class User extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "Users";
    }  
}

module.exports = User;