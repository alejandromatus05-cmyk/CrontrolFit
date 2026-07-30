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
        const { member_id, membership_id, amount_paid, duration_days } = req.body;
        if (!member_id || !membership_id || !amount_paid || !duration_days) {
            return res.status(400).json({ status: 'error', message: 'Todos los campos son obligatorios' });
        }
        const newPayment = await paymentModel.createPayment(member_id, membership_id, amount_paid, duration_days);
        res.status(201).json({ status: 'success', message: 'Pago registrado y membresía activada', data: newPayment });
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

module.exports = {
    getMemberships,
    postPayment,
    getPayments
};