const mysql = require('mysql2/promise');
const config = require('./config.json');

const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port
});

module.exports = pool;
