const express = require('express');
const router = express.Router();

const licenciasController = require('../../controllers/casa-web/licencias.controller');

module.exports = () => {
    router.post('/existeLicencia', licenciasController.existLicence);
    router.post('/mostrarLicenciasUsuarios', licenciasController.getLicenceUser);
    router.post('/insertarUsuario', licenciasController.insertUser);
    router.post('/agregarProductos', licenciasController.insertProducts);
    router.post('/loginEbooks', licenciasController.loginUser);
    return router;
}