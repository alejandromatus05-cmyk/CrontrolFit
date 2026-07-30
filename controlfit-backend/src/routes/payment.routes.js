const { Router } = require('express');
const { getMemberships, postPayment, getPayments } = require('../controllers/payment.controller');

const router = Router();

router.get('/memberships', getMemberships);
router.post('/payments', postPayment);
router.get('/payments', getPayments);

module.exports = router;