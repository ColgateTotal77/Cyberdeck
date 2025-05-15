const Model = require('../model.js');

class User extends Model {
    constructor (obj = {}) {
        super(obj)
        this.tableName = "users";
    }  
}

module.exports = User;