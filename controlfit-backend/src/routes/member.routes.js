const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');

// Middleware de ejemplo para verificar si el usuario es administrador
// (Asegúrate de adaptarlo según cómo estés manejando la autenticación y los roles en tu proyecto)
const verificarAdmin = (req, res, next) => {
  // Puedes leer el rol desde los headers, un token decodificado (req.user), etc.
  const rolUsuario = req.headers['x-user-rol'] || req.user?.rol;
  
  if (rolUsuario && (rolUsuario.toLowerCase() === 'admin' || rolUsuario.toLowerCase() === 'administrador')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado: Solo los administradores pueden realizar esta acción.' 
    });
  }
};

// Rutas públicas (o accesibles para lectura por cualquier rol)
router.get('/', memberController.getMembers);         // READ: Listar

// Rutas protegidas exclusivamente para Administradores
router.post('/', verificarAdmin, memberController.createMember);     // CREATE: Registrar socio
router.put('/:id', verificarAdmin, memberController.updateMember);   // UPDATE: Modificar datos / Activar
router.delete('/:id', verificarAdmin, memberController.deleteMember);// DELETE: Inactivar socio

module.exports = router;