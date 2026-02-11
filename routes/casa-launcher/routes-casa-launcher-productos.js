const express = require('express');
const dbMiddleware = require('../../middlewares/dbMiddleware');
const casaLauncherVerifyToken = require('../../middlewares/casaLauncherAuthMiddleware');
const { getProductos } = require('../../controllers/casa-launcher/casa-launcher-productos.controller');

const router = express.Router();

module.exports = () => {
    // Productos del usuario (licencias → paquetes → productos). Requiere JWT.
    router.get('/', dbMiddleware, casaLauncherVerifyToken, getProductos);

    return router;
};
