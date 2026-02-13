const express = require('express');
const dbMiddleware = require('../../middlewares/dbMiddleware');
const { casaLauncherLogin } = require('../../controllers/casa-launcher/casa-launcher-auth.controller');

const router = express.Router();

module.exports = () => {
    router.post('/login', dbMiddleware, casaLauncherLogin);
    return router;
};