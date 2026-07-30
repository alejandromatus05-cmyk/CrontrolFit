const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de la conexión a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'controlfit_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================== 1. LOGIN DE ADMINISTRADOR / USUARIO ====================
app.post('/api/login', async (req, res) => {
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
});

// ==================== 2. DASHBOARD Y MÉTRICAS ====================
app.get('/api/dashboard', async (req, res) => {
  try {
    // Métricas de Socios Activos / Inactivos
    const [activeRows] = await pool.query('SELECT COUNT(*) as count FROM socios WHERE estado = "activo"');
    const [inactiveRows] = await pool.query('SELECT COUNT(*) as count FROM socios WHERE estado = "inactivo"');

    // Membresías próximas a vencer (en menos de 7 días a partir de hoy)
    const [expiringSoon] = await pool.query(`
      SELECT sm.*, s.nombre, s.apellido, s.correo, s.telefono, m.nombre as membresia_nombre,
      DATEDIFF(sm.fecha_fin, CURDATE()) as dias_restantes
      FROM socios_membresias sm
      JOIN socios s ON sm.id_socio = s.id_socio
      JOIN membresias m ON sm.id_membresia = m.id_membresia
      WHERE sm.estado = 'activa' AND sm.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);

    // Listado general de socios con su membresía actual
    const [allMembers] = await pool.query(`
      SELECT s.*, sm.fecha_inicio, sm.fecha_fin, sm.estado as estado_membresia, m.nombre as membresia_nombre, p.monto, p.metodo_pago
      FROM socios s
      LEFT JOIN socios_membresias sm ON s.id_socio = sm.id_socio AND sm.estado = 'activa'
      LEFT JOIN membresias m ON sm.id_membresia = m.id_membresia
      LEFT JOIN pagos p ON sm.id_socio_membresia = p.id_socio_membresia
      ORDER BY s.fecha_registro DESC
    `);

    // Historial de Pagos completo
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
        expiringSoon: expiringSoon.length
      },
      expiringSoonList: expiringSoon,
      allMembers,
      paymentHistory
    });
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 3. REGISTRAR NUEVO SOCIO + MEMBRESÍA + PAGO ====================
app.post('/api/members', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      nombre, apellido, correo, telefono, fecha_nacimiento, sexo, direccion,
      id_membresia, fecha_inicio, duracion_dias, monto, metodo_pago, registrado_por 
    } = req.body;

    // 1. Insertar socio
    const [socioResult] = await connection.query(
      `INSERT INTO socios (nombre, apellido, correo, telefono, fecha_nacimiento, sexo, direccion, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [nombre, apellido, correo || null, telefono || null, fecha_nacimiento || null, sexo || 'otro', direccion || null]
    );
    const id_socio = socioResult.insertId;

    // Calcular fecha fin basados en la fecha de inicio y duración de días
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
      [id_socio, id_socio_membresia, monto, metodo_pago || 'efectivo', registrado_por || null]
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
});

// ==================== 4. LISTADO DE MEMBRESÍAS (CATÁLOGO) ====================
app.get('/api/membresias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM membresias WHERE estado = "activa"');
    res.json({ success: true, membresias: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor en puerto 3000
app.listen(3000, () => {
  console.log('Servidor backend ControlFit corriendo en http://localhost:3000');
});