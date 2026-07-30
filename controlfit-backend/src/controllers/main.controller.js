const pool = require('../config/db');

const getStatus = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({
            status: 'success',
            message: 'ControlFit API funcionando al 100%',
            db_test: rows[0].solution === 2 ? 'Conexión a MySQL exitosa' : 'Revisar conexión'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al conectar con la base de datos',
            error: error.message
        });
    }
};

module.exports = {
    getStatus
};