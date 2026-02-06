const express = require('express');
const dbMiddleware = require('../../middlewares/dbMiddleware');
const casaLauncherVerifyToken = require('../../middlewares/casaLauncherAuthMiddleware');
const {
    casaLauncherLogin,
    casaLauncherMe
} = require('../../controllers/casa-launcher/casa-launcher-auth.controller');

const router = express.Router();

module.exports = () => {
    // Login CASA-LAUNCHER
    router.post('/login', dbMiddleware, casaLauncherLogin);

    // Información del usuario autenticado (opcional, protegida por JWT)
    router.get('/me', casaLauncherVerifyToken, casaLauncherMe);

    return router;
};