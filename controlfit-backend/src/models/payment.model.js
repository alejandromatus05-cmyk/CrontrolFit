const pool = require("../config/db");

// Obtener todas las membresías disponibles
const getAllMemberships = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM membresias WHERE estado = "activa"',
  );
  return rows;
};

// Registrar un pago (Evalúa si es pagado de inmediato o pendiente según el método de pago)
const createPayment = async (
  member_id,
  membership_id,
  amount_paid,
  duration_days,
  payment_method = 'efectivo',
  estadoInicial = 'pendiente'
) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let fecha_inicio = null;
    let fecha_fin = null;
    let estadoMembresia = 'pendiente';

    // SI EL PAGO ES POR TARJETA (O ya viene como pagado), calculamos fechas y activamos de inmediato
    if (estadoInicial === 'pagado') {
      fecha_inicio = new Date().toISOString().split("T")[0];
      const startDateObj = new Date(fecha_inicio);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + parseInt(duration_days));
      fecha_fin = endDateObj.toISOString().split("T")[0];
      estadoMembresia = 'activa';
    }

    // 1. Insertar en socios_membresias (Si es pendiente, fechas van en null o sin activar fechas)
    const [smResult] = await connection.query(
      `INSERT INTO socios_membresias (id_socio, id_membresia, fecha_inicio, fecha_fin, estado) 
             VALUES (?, ?, ?, ?, ?)`,
      [member_id, membership_id, fecha_inicio, fecha_fin, estadoMembresia],
    );
    const id_socio_membresia = smResult.insertId;

    // 2. Insertar en pagos
    const [paymentResult] = await connection.query(
      `INSERT INTO pagos (id_socio, id_socio_membresia, monto, metodo_pago, estado) 
             VALUES (?, ?, ?, ?, ?)`,
      [member_id, id_socio_membresia, amount_paid, payment_method, estadoInicial],
    );

    await connection.commit();
    return { 
      id_pago: paymentResult.insertId, 
      member_id, 
      amount_paid, 
      estado: estadoInicial 
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Confirmar un pago pendiente y actualizar automáticamente las fechas de la membresía
const confirmAndUpdateMembership = async (id_pago) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener la información del pago y la membresía asociada
    const [pagoRows] = await connection.query(
      `SELECT p.*, sm.id_membresia, m.duracion_dias 
       FROM pagos p
       LEFT JOIN socios_membresias sm ON p.id_socio_membresia = sm.id_socio_membresia
       LEFT JOIN membresias m ON sm.id_membresia = m.id_membresia
       WHERE p.id_pago = ?`,
      [id_pago]
    );

    if (pagoRows.length === 0) {
      throw new Error('Pago no encontrado');
    }

    const pago = pagoRows.log || pagoRows[0];
    const duracion_dias = pago.duracion_dias || 30; // 30 días por defecto si no especifica

    // 2. Actualizar el estado del pago a 'pagado'
    await connection.query(
      `UPDATE pagos SET estado = 'pagado' WHERE id_pago = ?`,
      [id_pago]
    );

    // 3. Calcular las nuevas fechas de vigencia a partir de hoy
    const fecha_inicio = new Date().toISOString().split("T")[0];
    const startDateObj = new Date(fecha_inicio);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + parseInt(duracion_dias));
    const fecha_fin = endDateObj.toISOString().split("T")[0];

    // 4. Actualizar la tabla socios_membresias con las fechas calculadas y estado activo
    if (pago.id_socio_membresia) {
      await connection.query(
        `UPDATE socios_membresias 
         SET fecha_inicio = ?, fecha_fin = ?, estado = 'activa' 
         WHERE id_socio_membresia = ?`,
        [fecha_inicio, fecha_fin, pago.id_socio_membresia]
      );
    }

    await connection.commit();
    return { id_pago, fecha_inicio, fecha_fin, estado: 'pagado' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Obtener el historial de pagos con JOIN hacia socios y membresías
const getAllPayments = async () => {
  const query = `
        SELECT 
            p.*, 
            s.nombre, 
            s.apellido, 
            COALESCE(m.nombre, 'Membresía General') AS nombre_membresia 
        FROM pagos p
        JOIN socios s ON p.id_socio = s.id_socio
        LEFT JOIN socios_membresias sm ON p.id_socio_membresia = sm.id_socio_membresia
        LEFT JOIN membresias m ON sm.id_membresia = m.id_membresia
        ORDER BY p.fecha_pago DESC
    `;
  const [rows] = await pool.query(query);
  return rows;
};

module.exports = {
  getAllMemberships,
  createPayment,
  confirmAndUpdateMembership,
  getAllPayments,
};