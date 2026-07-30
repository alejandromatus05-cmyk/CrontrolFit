const pool = require('../config/db');

const getAllMembers = async () => {
    const [rows] = await pool.query('SELECT * FROM members ORDER BY created_at DESC');
    return rows;
};

const createMember = async (name, email, phone) => {
    const [result] = await pool.query(
        'INSERT INTO members (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone]
    );
    return { id: result.insertId, name, email, phone };
};

module.exports = {
    getAllMembers,
    createMember
};