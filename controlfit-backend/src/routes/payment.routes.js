const { Router } = require('express');
const { 
  getMemberships, 
  postPayment, 
  getPayments, 
  confirmPayment 
} = require('../controllers/payment.controller');

const router = Router();

router.get('/memberships', getMemberships);
router.post('/', postPayment);
router.get('/', getPayments);

// Nueva ruta para confirmar el pago pendiente y actualizar fechas automáticamente
router.put('/:id/confirmar', confirmPayment);

module.exports = router;