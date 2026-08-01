import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserPlus, Users, UserX, UserCheck, Search, Eye, X, Edit } from 'lucide-react';
import '../css/Members.css';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Estados para modales
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [editingSocio, setEditingSocio] = useState(null);

  // Validación de Rol basada en el valor de la base de datos ("administrador")
  const userRol = localStorage.getItem('rol') || localStorage.getItem('userRole') || '';
  const esAdmin = userRol.toLowerCase().trim() === 'admin' || userRol.toLowerCase().trim() === 'administrador';

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    sexo: 'masculino',
    fecha_registro: new Date().toISOString().split('T')[0],
    id_membresia: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    monto: '',
    metodo_pago: 'efectivo'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resMembers = await api.getMembers();
      if (resMembers.success) {
        // ORDENAR: Activos primero, Inactivos al fondo automáticamente
        const ordenados = resMembers.data.sort((a, b) => {
          const estadoA = (a.estado || 'activo').toLowerCase();
          const estadoB = (b.estado || 'activo').toLowerCase();

          if (estadoA === 'activo' && estadoB !== 'activo') return -1;
          if (estadoA !== 'activo' && estadoB === 'activo') return 1;
          return 0;
        });
        setMembers(ordenados);
      }

      const resMembresias = await api.getMembresias();
      if (resMembresias.success) setMembresias(resMembresias.membresias);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuarioLogueadoId = localStorage.getItem('userId') || localStorage.getItem('id_usuario') || 1;

    const datosCompletos = {
      ...form,
      registrado_por: usuarioLogueadoId
    };

    const res = await api.createMember(datosCompletos);
    if (res.success) {
      alert('Socio registrado y membresía activada con éxito');
      cargarDatos();
      setShowForm(false);
      setForm({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        sexo: 'masculino',
        fecha_registro: new Date().toISOString().split('T')[0],
        id_membresia: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        monto: '',
        metodo_pago: 'efectivo'
      });
    } else {
      alert('Error: ' + (res.error || 'No se pudo registrar'));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!esAdmin) {
      alert('Acceso denegado.');
      return;
    }

    try {
      const res = await api.updateMember(editingSocio.id_socio, editingSocio);
      console.log("Respuesta del servidor:", res);

      // Verificación flexible para cubrir cualquier estructura devuelta por el backend
      if (res && (res.success === true || res.ok === true || res.message || res.affectedRows > 0 || !res.error)) {
        alert('Socio actualizado con éxito');
        setEditingSocio(null);
        cargarDatos();
      } else {
        alert('Error al actualizar: ' + (res.message || res.error || 'No se pudo guardar'));
      }
    } catch (error) {
      console.error('Error al editar socio:', error);
      alert('Error de conexión.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!esAdmin) {
      alert('Acceso denegado: Solo los administradores pueden realizar esta acción.');
      return;
    }
    if (confirm('¿Estás seguro de dar de baja a este socio? Su estado pasará a inactivo.')) {
      try {
        const res = await api.deleteMember(id);

        if (res && res.success) {
          cargarDatos(); 
        } else {
          alert('No se pudo dar de baja al socio: ' + (res.message || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error al desactivar socio:', error);
        alert('Error de conexión al intentar dar de baja.');
      }
    }
  };

  const handleActivate = async (id) => {
    if (!esAdmin) {
      alert('Acceso denegado: Solo los administradores pueden realizar esta acción.');
      return;
    }
    if (confirm('¿Deseas activar nuevamente a este socio? Su estado pasará a activo.')) {
      try {
        const res = await api.updateMember(id, { estado: 'activo' });

        if (res && res.success) {
          cargarDatos();
        } else {
          alert('No se pudo activar al socio.');
        }
      } catch (error) {
        console.error('Error al activar socio:', error);
        alert('Error de conexión al intentar activar.');
      }
    }
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    return fechaStr.split('T')[0];
  };

  const sociosFiltrados = members.filter(socio => 
    `${socio.nombre} ${socio.apellido} ${socio.correo || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="members-container">
      <div className="members-top-action-bar">
        <h2>Base General de Socios</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-toggle-form">
          <UserPlus size={18} /> {showForm ? 'Cancelar Registro' : 'Registrar Nuevo Socio'}
        </button>
      </div>

      {showForm && (
        <div className="form-card-floating">
          <h3>Registro Rápido de Socio y Membresía</h3>
          <form onSubmit={handleSubmit} className="member-form">
            <div className="form-row">
              <input type="text" placeholder="Nombre *" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
              <input type="text" placeholder="Apellido *" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} required />
            </div>

            <div className="form-row">
              <input type="email" placeholder="Correo electrónico" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} />
              <input type="text" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
            </div>

            <div className="form-row">
              <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})} required>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
              <div className="input-group-date" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                <label style={{fontSize: '12px', color: '#a0a0ab', marginBottom: '4px'}}>Fecha de Registro:</label>
                <input type="date" value={form.fecha_registro} onChange={e => setForm({...form, fecha_registro: e.target.value})} required />
              </div>
            </div>

            <hr className="form-divider" />

            <div className="form-row">
              <select value={form.id_membresia} onChange={e => {
                const selected = membresias.find(m => m.id_membresia == e.target.value);
                setForm({
                  ...form, 
                  id_membresia: e.target.value, 
                  monto: selected ? selected.precio : ''
                });
              }} required>
                <option value="">Seleccione Membresía *</option>
                {membresias.map(m => (
                  <option key={m.id_membresia} value={m.id_membresia}>{m.nombre} (${m.precio})</option>
                ))}
              </select>
              <div className="input-group-date" style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                <label style={{fontSize: '12px', color: '#a0a0ab', marginBottom: '4px'}}>Fecha Inicio Membresía:</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} required />
              </div>
            </div>

            <div className="form-row">
              <input type="number" placeholder="Monto a Pagar ($) *" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} required />
              <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">Guardar Socio y Registrar Pago</button>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="section-header-flex">
          <h3><Users size={20} /> Listado General ({members.length} Socios)</h3>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="members-table">
            <thead>
              <tr>
                <th>Nombre del Socio</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sociosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">No se encontraron socios registrados.</td>
                </tr>
              ) : (
                sociosFiltrados.map(socio => {
                  const esInactivo = (socio.estado || '').toLowerCase() === 'inactivo';

                  return (
                    <tr 
                      key={socio.id_socio}
                      style={{
                        backgroundColor: esInactivo ? 'rgba(255, 71, 87, 0.12)' : 'transparent',
                        color: esInactivo ? '#ff6b81' : 'inherit',
                        opacity: esInactivo ? 0.8 : 1
                      }}
                    >
                      <td><strong>{socio.nombre} {socio.apellido}</strong></td>
                      <td>{socio.correo || socio.telefono || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${socio.estado}`} style={{
                          backgroundColor: esInactivo ? '#ff4757' : undefined,
                          color: '#fff'
                        }}>
                          {socio.estado ? socio.estado.toUpperCase() : 'ACTIVO'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          {/* Botón ver detalles visible para todos */}
                          <button 
                            onClick={() => setSelectedSocio(socio)} 
                            className="btn-action btn-view" 
                            title="Ver datos completos"
                          >
                            <Eye size={16} />
                          </button>

                          {/* BOTONES DE ADMINISTRADOR (Editar, Activar o Dar de baja) */}
                          {esAdmin && (
                            <>
                              <button 
                                onClick={() => setEditingSocio({...socio})} 
                                className="btn-action btn-edit" 
                                title="Modificar datos"
                                style={{ backgroundColor: '#f1c40f', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Edit size={16} />
                              </button>

                              {esInactivo ? (
                                <button 
                                  onClick={() => handleActivate(socio.id_socio)} 
                                  className="btn-action btn-activate" 
                                  title="Activar socio"
                                  style={{ backgroundColor: '#2ed573', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  <UserCheck size={16} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleDeactivate(socio.id_socio)} 
                                  className="btn-action btn-deactivate" 
                                  title="Dar de baja"
                                >
                                  <UserX size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Ver Detalles */}
      {selectedSocio && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detalles del Socio</h3>
              <button onClick={() => setSelectedSocio(null)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body socio-details-body">
              <p><strong>Nombre completo:</strong> {selectedSocio.nombre} {selectedSocio.apellido}</p>
              <p><strong>Correo electrónico:</strong> {selectedSocio.correo || 'No registrado'}</p>
              <p><strong>Teléfono:</strong> {selectedSocio.telefono || 'No registrado'}</p>
              <p><strong>Sexo:</strong> {selectedSocio.sexo || 'No especificado'}</p>
              <p><strong>Estado actual:</strong> <span className={`status-badge ${selectedSocio.estado}`}>{selectedSocio.estado}</span></p>
              <hr className="form-divider" />
              <p><strong>Membresía:</strong> {selectedSocio.membresia_nombre || selectedSocio.nombre_membresia || 'N/A'}</p>
              <p><strong>Fecha de inicio de membresía:</strong> {selectedSocio.fecha_inicio ? selectedSocio.fecha_inicio.split('T')[0] : 'N/A'}</p>
              <p><strong>Fecha de terminación de membresía:</strong> {selectedSocio.fecha_fin ? selectedSocio.fecha_fin.split('T')[0] : 'N/A'}</p>
              <p><strong>Fecha de registro:</strong> {formatearFechaHora(selectedSocio.fecha_registro)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Socio */}
      {editingSocio && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Modificar Datos del Socio</h3>
              <button onClick={() => setEditingSocio(null)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-body member-form">
              <div className="form-row">
                <input 
                  type="text" 
                  placeholder="Nombre" 
                  value={editingSocio.nombre || ''} 
                  onChange={e => setEditingSocio({...editingSocio, nombre: e.target.value})} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Apellido" 
                  value={editingSocio.apellido || ''} 
                  onChange={e => setEditingSocio({...editingSocio, apellido: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-row">
                <input 
                  type="email" 
                  placeholder="Correo" 
                  value={editingSocio.correo || ''} 
                  onChange={e => setEditingSocio({...editingSocio, correo: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Teléfono" 
                  value={editingSocio.telefono || ''} 
                  onChange={e => setEditingSocio({...editingSocio, telefono: e.target.value})} 
                />
              </div>
              <div className="form-row">
                <select 
                  value={editingSocio.sexo || 'masculino'} 
                  onChange={e => setEditingSocio({...editingSocio, sexo: e.target.value})}
                >
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <button type="submit" className="submit-btn" style={{marginTop: '15px'}}>Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}