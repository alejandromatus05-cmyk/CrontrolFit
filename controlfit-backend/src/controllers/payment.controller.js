const paymentModel = require('../models/payment.model');

const getMemberships = async (req, res) => {
    try {
        const memberships = await paymentModel.getAllMemberships();
        res.json({ status: 'success', data: memberships });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const postPayment = async (req, res) => {
    try {
        const { member_id, membership_id, amount_paid, duration_days, payment_method } = req.body;
        
        if (!member_id || !membership_id || !amount_paid || !duration_days) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }

        // Definir estado inicial según el método de pago (Tarjeta = pagado, Efectivo/Transferencia = pendiente)
        const metodo = payment_method || 'efectivo';
        const estadoInicial = metodo === 'tarjeta' ? 'pagado' : 'pendiente';

        // Crear el pago pasando también el método y el estado inicial
        const newPayment = await paymentModel.createPayment(
            member_id, 
            membership_id, 
            amount_paid, 
            duration_days, 
            metodo, 
            estadoInicial
        );

        res.status(201).json({ 
            status: 'success', 
            message: estadoInicial === 'pagado' 
                ? 'Pago registrado y membresía activada' 
                : 'Pago registrado como pendiente (fechas sin modificar)', 
            data: newPayment 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const payments = await paymentModel.getAllPayments();
        res.json({ status: 'success', data: payments });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Nueva función para confirmar un pago pendiente desde el historial
const confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;

        // Llamamos al modelo para que cambie el estado a 'pagado' y actualice las fechas del socio
        const result = await paymentModel.confirmAndUpdateMembership(id);

        res.json({ 
            status: 'success', 
            message: 'Pago confirmado exitosamente y fechas de membresía actualizadas', 
            data: result 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getMemberships,
    postPayment,
    getPayments,
    confirmPayment
};