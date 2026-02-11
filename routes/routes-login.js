const express = require('express');
const router = express.Router();

const loginController = require('../controllers/ADMIN/login/login.controller');

module.exports = () => {

    router.post('/login', loginController.login);

    return router;
}