require('dotenv').config();

module.exports = {
    development: {
        host: process.env.CASA_HOST_DEV,
        port: process.env.CASA_PORT_DEV,
        database: process.env.CASA_DATABASE_DEV,
        username: process.env.CASA_USERNAME_DEV,
        password: process.env.CASA_PASSWORD_DEV,
        dialect: process.env.CASA_DIALECT_DEV,
    },
    production: {
        host: process.env.CASA_HOST,
        port: process.env.CASA_PORT,
        database: process.env.CASA_DATABASE,
        username: process.env.CASA_USERNAME,
        password: process.env.CASA_PASSWORD,
        dialect: process.env.CASA_DIALECT,
    }
};