const pool = require('../config/db');

// Login de usuario/administrador
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE correo = ? AND password = ? AND estado = "activo"',
      [correo, password]
    );

    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo.' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Dashboard y métricas
const getDashboard = async (req, res) => {
  try {
    const [activeRows] = await pool.query('SELECT COUNT(*) as count FROM socios WHERE estado = "activo"');
    const [inactiveRows] = await pool.query('SELECT COUNT(*) as count FROM socios WHERE estado = "inactivo"');

    // Conteo de membresías por tipo para las gráficas de la nueva vista de Información General
    const [membershipStats] = await pool.query(`
      SELECT m.nombre as membresia, COUNT(sm.id_socio_membresia) as total
      FROM socios_membresias sm
      JOIN membresias m ON sm.id_membresia = m.id_membresia
      WHERE sm.estado = 'activa'
      GROUP BY m.id_membresia
    `);

    const [rawExpiringSoon] = await pool.query(`
      SELECT sm.*, s.nombre, s.apellido, s.correo, s.telefono, m.nombre as membresia_nombre,
      DATEDIFF(sm.fecha_fin, CURDATE()) as dias_restantes
      FROM socios_membresias sm
      JOIN socios s ON sm.id_socio = s.id_socio
      JOIN membresias m ON sm.id_membresia = m.id_membresia
      WHERE sm.estado = 'activa' 
        AND s.estado = 'activo' 
        AND sm.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    // Filtro para eliminar registros con campos en blanco o vacíos en los datos clave
    const validExpiringSoon = rawExpiringSoon.filter(item => {
      return (
        item.nombre && item.nombre.trim() !== '' &&
        item.membresia_nombre && item.membresia_nombre.trim() !== '' &&
        item.fecha_fin
      );
    });

    // Filtro estricto en JavaScript para evitar cualquier duplicidad por ID de socio
    const expiringSoon = Array.from(
      new Map(validExpiringSoon.map(item => [item.id_socio, item])).values()
    );

    const [allMembers] = await pool.query(`
      SELECT s.*, sm.fecha_inicio, sm.fecha_fin, sm.estado as estado_membresia, m.nombre as membresia_nombre, p.monto, p.metodo_pago
      FROM socios s
      LEFT JOIN socios_membresias sm ON s.id_socio = sm.id_socio AND sm.estado = 'activa'
      LEFT JOIN membresias m ON sm.id_membresia = m.id_membresia
      LEFT JOIN pagos p ON sm.id_socio_membresia = p.id_socio_membresia
      GROUP BY s.id_socio
      ORDER BY s.fecha_registro DESC
    `);

    const [paymentHistory] = await pool.query(`
      SELECT p.*, s.nombre, s.apellido, m.nombre as membresia_nombre, u.nombre as atendido_por_nombre
      FROM pagos p
      JOIN socios s ON p.id_socio = s.id_socio
      JOIN socios_membresias sm ON p.id_socio_membresia = sm.id_socio_membresia
      JOIN membresias m ON sm.id_membresia = m.id_membresia
      LEFT JOIN usuarios u ON p.registrado_por = u.id_usuario
      ORDER BY p.fecha_pago DESC
    `);

    res.json({
      success: true,
      metrics: {
        active: activeRows[0].count,
        inactive: inactiveRows[0].count,
        expiringSoon: expiringSoon.length,
        membershipDistribution: membershipStats
      },
      expiringSoonList: expiringSoon,
      allMembers,
      paymentHistory
    });
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Catálogo de membresías activas
const getMembresias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM membresias WHERE estado = "activa"');
    res.json({ success: true, membresias: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Actualizar datos de un socio
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, telefono, sexo, estado } = req.body;

    await pool.query(
      `UPDATE socios SET nombre = ?, apellido = ?, correo = ?, telefono = ?, sexo = ?, estado = ? WHERE id_socio = ?`,
      [nombre, apellido, correo, telefono, sexo, estado || 'activo', id]
    );

    res.json({ success: true, message: 'Socio actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Dar de baja (desactivar) a un socio
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE socios SET estado = "inactivo" WHERE id_socio = ?', [id]);
    res.json({ success: true, message: 'Socio dado de baja correctamente' });
  } catch (error) {
    console.error('Error al dar de baja socio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  login, 
  getDashboard, 
  getMembresias, 
  updateMember, 
  deleteMember 
};