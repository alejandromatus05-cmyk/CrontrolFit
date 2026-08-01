const pool = require('../config/db');

// Listar todos los socios (actualiza automáticamente a inactivo si su membresía venció)
const getMembers = async (req, res) => {
  try {
    // 1. Opcional pero recomendado: Actualizar masivamente en la BD los socios cuya fecha_fin ya expiró
    await pool.query(`
      UPDATE socios s
      JOIN socios_membresias sm ON s.id_socio = sm.id_socio
      SET s.estado = 'inactivo'
      WHERE sm.estado = 'activa' AND sm.fecha_fin < CURDATE() AND s.estado = 'activo'
    `);

    // 2. Obtener la lista con los datos actualizados y la membresía activa
    const query = `
      SELECT 
        s.*, 
        m.nombre AS nombre_membresia, 
        sm.fecha_inicio, 
        sm.fecha_fin 
      FROM socios s
      LEFT JOIN socios_membresias sm ON s.id_socio = sm.id_socio AND sm.estado = 'activa'
      LEFT JOIN membresias m ON sm.id_membresia = m.id_membresia
      ORDER BY s.fecha_registro DESC
    `;
    const [rows] = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Registrar nuevo socio con su membresía y pago mediante Transacción
const createMember = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      nombre, apellido, correo, telefono, sexo, 
      fecha_registro, id_membresia, fecha_inicio, duracion_dias, monto, metodo_pago, registrado_por 
    } = req.body;

    const idUsuarioRegistro = registrado_por || req.user?.id || 1;

    const fechaRegistroLimpia = fecha_registro 
      ? fecha_registro.split('T')[0] 
      : new Date().toISOString().split('T')[0];

    // 1. Insertar socio
    const [socioResult] = await connection.query(
      `INSERT INTO socios (nombre, apellido, correo, telefono, sexo, fecha_registro, estado) 
       VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
      [
        nombre, 
        apellido, 
        correo || null, 
        telefono || null, 
        sexo || 'masculino', 
        fechaRegistroLimpia
      ]
    );
    const id_socio = socioResult.insertId;

    const startDateObj = new Date(fecha_inicio);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + parseInt(duracion_dias || 30));
    const fecha_fin = endDateObj.toISOString().split('T')[0];

    // 2. Insertar membresía del socio
    const [membresiaSocioResult] = await connection.query(
      `INSERT INTO socios_membresias (id_socio, id_membresia, fecha_inicio, fecha_fin, estado) 
       VALUES (?, ?, ?, ?, 'activa')`,
      [id_socio, id_membresia, fecha_inicio, fecha_fin]
    );
    const id_socio_membresia = membresiaSocioResult.insertId;

    // 3. Registrar el pago inicial
    await connection.query(
      `INSERT INTO pagos (id_socio, id_socio_membresia, monto, metodo_pago, estado, registrado_por) 
       VALUES (?, ?, ?, ?, 'pagado', ?)`,
      [id_socio, id_socio_membresia, monto, metodo_pago || 'efectivo', idUsuarioRegistro]
    );

    await connection.commit();
    res.json({ success: true, message: 'Socio registrado con éxito y membresía activada.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar socio:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
};

// Actualizar socio
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, telefono, sexo, estado } = req.body;

    await pool.query(
      `UPDATE socios SET nombre = ?, apellido = ?, correo = ?, telefono = ?, sexo = ?, estado = ? WHERE id_socio = ?`,
      [nombre, apellido, correo, telefono, sexo, estado, id]
    );

    res.json({ success: true, message: 'Socio actualizado correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Desactivar socio (Borrado lógico)
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE socios SET estado = "inactivo" WHERE id_socio = ?', [id]);
    res.json({ success: true, message: 'Socio marcado como inactivo correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getMembers, createMember, updateMember, deleteMember };