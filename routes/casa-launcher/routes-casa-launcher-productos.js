const express = require('express');
const dbMiddleware = require('../../middlewares/dbMiddleware');
const { getProductos } = require('../../controllers/casa-launcher/casa-launcher-productos.controller');

const router = express.Router();

module.exports = () => {
    // Productos del usuario. Query: usuario (identificador del usuario).
    router.get('/', dbMiddleware, getProductos);
    return router;
};
