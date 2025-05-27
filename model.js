const db = require('./db.js');

class Model {
    constructor (obj = {}) {
        Object.assign(this, obj);
    }

    async find(id) {
        const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);

        if (rows.length > 0) {
            Object.assign(this, rows[0]);
            return this;
        } 
        else return null;
    }

    async delete() {
        if (!this.id) return false;

        const [rows] = await db.execute(`SELECT 1 FROM ${this.tableName} WHERE id = ?`, [this.id]);

        if (rows.length === 0) return false;

        const [result] = await db.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [this.id]);

        return result.affectedRows > 0;
    }

    async save() {
        const fields = Object.keys(this).filter(key => key !== 'id' && key !== 'tableName');

        if (this.id) {
            const placeholders = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => this[field]);
            values.push(this.id);

            await db.execute(`UPDATE ${this.tableName} SET ${placeholders} WHERE id = ?`, values);

            return this;
        } 
        else {
            const columns = fields.join(', ');
            const placeholders = fields.map(() => '?').join(', ');
            const values = fields.map(field => this[field]);

            const [result] = await db.execute(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`, values);

            this.id = result.insertId;
            return this;
        }
    }

    async findByField(field, data) {
        const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE ${field} = ?`, [data]);

        if (rows.length > 0) {
            Object.assign(this, rows[0]);
            return this;
        } 
        else return null;
    }
}

module.exports = Model;