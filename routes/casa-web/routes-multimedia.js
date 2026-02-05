const express = require('express');
const router = express.Router();

const multimediaController = require('../../controllers/casa-web/multimedia.controller');

module.exports = () => {
    router.post('/mostrarMultimedia', multimediaController.allMultimedia);
    return router;
}