const express = require('express');
const router = express.Router();
const desktopAuthController = require('../../controllers/casa-launcher/desktop-auth.controller');

module.exports = () => {
    router.post('/generate', desktopAuthController.postGenerateToken);
    router.post('/generate-from-user', desktopAuthController.postGenerateTokenFromUser);
    router.post('/validate', desktopAuthController.postValidateToken);
    return router;
};