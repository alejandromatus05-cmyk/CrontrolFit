const pool = require('../config/db');

// Obtener todos los tipos de membresías disponibles
const getAllMemberships = async () => {
    const [rows] = await pool.query('SELECT * FROM memberships');
    return rows;
};

// Registrar un pago y calcular su fecha de expiración
const createPayment = async (member_id, membership_id, amount_paid, duration_days) => {
    // Calcular fecha de expiración sumando los días de la membresía a la fecha actual
    const [result] = await pool.query(
        `INSERT INTO payments (member_id, membership_id, amount_paid, expires_at) 
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
        [member_id, membership_id, amount_paid, duration_days]
    );
    return { id: result.insertId, member_id, membership_id, amount_paid };
};

// Ver historial de pagos
const getAllPayments = async () => {
    const [rows] = await pool.query(`
        payments.id, m.name AS member_name, mem.name AS membership_name, 
        payments.amount_paid, payments.payment_date, payments.expires_at
        FROM payments
        JOIN members m ON payments.member_id = m.id
        JOIN memberships mem ON payments.membership_id = mem.id
        ORDER BY payments.payment_date DESC
    `);
    return rows;
};

module.exports = {
    getAllMemberships,
    createPayment,
    getAllPayments
};