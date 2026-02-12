const express = require('express');
const router = express.Router();

const multimediaController = require('../../controllers/casa-web/multimedia.controller');

module.exports = () => {
    router.post('/mostrarMultimedia', multimediaController.allMultimedia);
    router.post('/mostrarGradosSubtipo', multimediaController.allGradosSubtipo);
    router.post('/mostrarMultimediaSubtipo', multimediaController.allMultimediaSubtipo);
    return router;
}