const express = require('express');
const { getLauncherUpdateInfo } = require('../../controllers/casa-launcher/casa-launcher-update.controller');

const router = express.Router();

module.exports = () => {
    // GET /casa/launcher/update/info
    router.get('/info', getLauncherUpdateInfo);
    return router;
};