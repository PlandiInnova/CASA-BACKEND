const express = require('express');
const dbMiddleware = require('../../middlewares/dbMiddleware');
const { getProductos } = require('../../controllers/casa-launcher/casa-launcher-productos.controller');
const { getArchivosProducto } = require('../../controllers/casa-launcher/casa-launcher-archivos.controller');

const router = express.Router();

module.exports = () => {
    // Productos del usuario. Query: usuario (identificador del usuario).
    router.get('/', dbMiddleware, getProductos);

    // Archivos de la carpeta de un producto. Sin dbMiddleware: solo lee el disco.
    router.get('/archivos', getArchivosProducto);
    return router;
};
