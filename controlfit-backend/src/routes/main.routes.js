const { Router } = require('express');
const { getStatus } = require('../controllers/main.controller');

const router = Router();

router.get('/status', getStatus);

module.exports = router;