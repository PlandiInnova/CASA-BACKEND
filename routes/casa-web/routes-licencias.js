const express = require('express');
const router = express.Router();

const licenciasController = require('../../controllers/casa-web/licencias.controller');

module.exports = () => {
    router.get('/todasLicencias', licenciasController.allLicencias);
    return router;
}