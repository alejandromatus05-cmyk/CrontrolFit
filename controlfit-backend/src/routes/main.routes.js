const express = require('express');
const router = express.Router();
const mainController = require('../controllers/main.controller');

router.post('/login', mainController.login);
router.get('/dashboard', mainController.getDashboard);
router.get('/membresias', mainController.getMembresias);


module.exports = router;