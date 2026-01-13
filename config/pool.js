const mysql = require('mysql');
const config = require('./config')[process.env.NODE_ENV || 'development'];
require('dotenv').config();

const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password,
    waitForConnections: true,
    queueLimit: 0
});

function handleDatabaseConnection(err) {
    if (err) {
        console.error(`Error de conexión (${new Date().toISOString()}):`, err.code);
        setTimeout(connectToDatabase, 5000);
    } else {
        console.log('✅ Conexión exitosa a la base de datos');
    }
}

function connectToDatabase() {
    pool.getConnection((err, connection) => {
        handleDatabaseConnection(err);
        if (connection) connection.release();
    });
}

connectToDatabase();

module.exports = pool;