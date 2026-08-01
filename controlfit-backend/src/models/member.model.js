const pool = require('../config/db');

// READ: Obtener todos los socios
const getAllMembers = async () => {
  const [rows] = await pool.query('SELECT * FROM socios ORDER BY fecha_registro DESC');
  return rows;
};

// CREATE: Insertar un nuevo socio
const createMember = async (data) => {
  const { nombre, apellido, correo, telefono, sexo, fecha_registro } = data;

  const [result] = await pool.query(
    'INSERT INTO socios (nombre, apellido, correo, telefono, sexo, fecha_registro, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, apellido, correo, telefono, sexo, fecha_registro, 'activo']
  );

  return { 
    id_socio: result.insertId, 
    nombre, 
    apellido, 
    correo, 
    telefono, 
    sexo, 
    fecha_registro, 
    estado: 'activo' 
  };
};

module.exports = {
  getAllMembers,
  createMember
};