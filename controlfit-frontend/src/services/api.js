const API_URL = 'http://localhost:3000/api'; // Ajusta tu puerto si es diferente

export const api = {
  login: async (correo, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });
    return res.json();
  },
  
  getDashboard: async () => {
    const res = await fetch(`${API_URL}/dashboard`);
    return res.json();
  },
  
  getMembers: async () => {
    const res = await fetch(`${API_URL}/members`);
    return res.json();
  },
  
  getMembresias: async () => {
    const res = await fetch(`${API_URL}/membresias`);
    return res.json();
  },
  
  createMember: async (data) => {
    const rol = localStorage.getItem('rol') || 'administrador';
    const res = await fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-rol': rol
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateMember: async (id, data) => {
    const rol = localStorage.getItem('rol') || 'administrador';
    const res = await fetch(`${API_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-rol': rol // 👈 Envía el rol para pasar la validación del backend
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  deleteMember: async (id) => {
    const rol = localStorage.getItem('rol') || 'administrador';
    const res = await fetch(`${API_URL}/members/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-rol': rol // 👈 Envía el rol para permitir dar de baja
      }
    });
    return res.json();
  },
  
  getPagosHistorial: async () => {
    const res = await fetch(`${API_URL}/payments`);
    return res.json();
  },

  enviarCorreoAviso: async (datosSocio) => {
    const res = await fetch(`${API_URL}/enviar-aviso-correo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        email: datosSocio.email || datosSocio.correo,
        socioId: datosSocio.id,
        nombreSocio: `${datosSocio.nombre} ${datosSocio.apellido}`,
        membresiaNombre: datosSocio.membresia_nombre,
        diasRestantes: datosSocio.dias_restantes
      })
    });
    return res.json();
  }
};