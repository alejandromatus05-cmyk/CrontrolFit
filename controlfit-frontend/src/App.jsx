// src/App.jsx - ControlFit Frontend Completo
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ correo: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [dashboardData, setDashboardData] = useState({
    metrics: { active: 0, inactive: 0, expiringSoon: 0 },
    expiringSoonList: [],
    allMembers: [],
    paymentHistory: []
  });

  const [membresiasCatalogo, setMembresiasCatalogo] = useState([]);
  const [search, setSearch] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [form, setForm] = useState({ 
    nombre: '', 
    apellido: '', 
    correo: '', 
    telefono: '', 
    fecha_nacimiento: '',
    sexo: 'masculino',
    direccion: '',
    id_membresia: '1', 
    fecha_inicio: new Date().toISOString().split('T')[0],
    duracion_dias: '30',
    monto: '300.00',
    metodo_pago: 'tarjeta',
    registrado_por: 1 
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
      loadMembresiasCatalogo();
    }
  }, [isLoggedIn]);

  const loadDashboard = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/dashboard');
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    }
  };

  const loadMembresiasCatalogo = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/membresias');
      if (response.data.success) {
        setMembresiasCatalogo(response.data.membresias);
      }
    } catch (error) {
      console.error('Error al cargar catálogo de membresías:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await axios.post('http://localhost:3000/api/login', loginForm);
      if (response.data.success) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      setLoginError('Correo o contraseña incorrectos.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/members', form);
      setForm({ 
        nombre: '', 
        apellido: '', 
        correo: '', 
        telefono: '', 
        fecha_nacimiento: '',
        sexo: 'masculino',
        direccion: '',
        id_membresia: '1', 
        fecha_inicio: new Date().toISOString().split('T')[0],
        duracion_dias: '30',
        monto: '300.00',
        metodo_pago: 'tarjeta',
        registrado_por: 1 
      });
      setShowRegisterModal(false);
      loadDashboard();
    } catch (error) {
      console.error('Error al registrar socio:', error);
    }
  };

  const handleSendNotification = (member) => {
    alert(`📢 Aviso de vencimiento enviado a ${member.nombre} (${member.correo}).`);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>⚡ ControlFit Admin</h2>
          {loginError && <p style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>{loginError}</p>}
          <form onSubmit={handleLogin} className="form-group-vertical">
            <div className="input-wrapper">
              <label>Correo Electrónico</label>
              <input
                type="email"
                placeholder="admin@controlfit.com"
                value={loginForm.correo}
                onChange={(e) => setLoginForm({ ...loginForm, correo: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div className="input-wrapper">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              Entrar al Sistema
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="top-theme-btn" style={{ display: 'inline-flex', width: 'auto', alignItems: 'center', gap: '6px' }}>
              {isDarkMode ? '☀️ Modo Claro' : '🌙 Modo Nocturno'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMembers = dashboardData.allMembers.filter(m => 
    (m.nombre + ' ' + m.apellido).toLowerCase().includes(search.toLowerCase()) || 
    (m.correo && m.correo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      {/* SIDEBAR ORIGINAL MANTENIDO */}
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-brand">
            ⚡ ControlFit
          </div>
          <ul className="sidebar-nav">
            <li><a className="sidebar-link active">📊 Dashboard</a></li>
            <li><a className="sidebar-link">👥 Socios</a></li>
            <li><a className="sidebar-link">💳 Membresías</a></li>
            <li><a className="sidebar-link">⚙️ Configuración</a></li>
          </ul>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setIsLoggedIn(false)} className="btn-logout">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {/* Header Superior con Botón Historial Discreto e Iconos Vectoriales */}
        <div className="main-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
          
          <button 
            className="top-theme-btn" 
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              background: showPaymentHistory ? 'var(--accent)' : 'var(--card-bg)',
              color: showPaymentHistory ? '#fff' : 'var(--text-main)',
              border: '1px solid var(--border-color)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            {showPaymentHistory ? 'Ocultar Historial' : 'Historial de Pagos'}
          </button>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="top-theme-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {isDarkMode ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                Modo Claro
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                Modo Nocturno
              </>
            )}
          </button>
        </div>

        {/* CONTENEDOR DESPLEGABLE: Historial de Pago */}
        {showPaymentHistory && (
          <div className="card-full" style={{ marginBottom: '2rem', border: '2px solid var(--accent)' }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Historial de Pagos de Socios</h3>
            <div className="table-container">
              <table className="professional-table">
                <thead>
                  <tr>
                    <th>Nombre del Socio</th>
                    <th>Membresía</th>
                    <th>Monto</th>
                    <th>Método de Pago</th>
                    <th>Estado</th>
                    <th>Registrado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                        No hay pagos registrados.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.paymentHistory.map((pay) => (
                      <tr key={pay.id_pago}>
                        <td><strong>{pay.nombre} {pay.apellido}</strong></td>
                        <td>{pay.membresia_nombre}</td>
                        <td>${pay.monto}</td>
                        <td>{pay.metodo_pago}</td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            background: pay.estado === 'pagado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: pay.estado === 'pagado' ? '#10b981' : '#f59e0b'
                          }}>
                            {pay.estado.toUpperCase()}
                          </span>
                        </td>
                        <td>{pay.atendido_por_nombre || 'Sistema'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="main-header-center">
          <h1>Panel de Control Principal</h1>
          <p>Administración y supervisión de socios ControlFit.</p>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="metrics-grid">
          <div className="metric-card">
            <span>Socios Activos</span>
            <h3>{dashboardData.metrics.active}</h3>
          </div>
          <div className="metric-card">
            <span>Socios Inactivos</span>
            <h3>{dashboardData.metrics.inactive}</h3>
          </div>
          <div className="metric-card">
            <span>Vencen en &lt; 1 Semana</span>
            <h3 style={{ color: dashboardData.metrics.expiringSoon > 0 ? '#f59e0b' : 'var(--accent)' }}>
              {dashboardData.metrics.expiringSoon}
            </h3>
          </div>
        </div>

        {/* Barra de Búsqueda y Botón Registro */}
        <div className="actions-bar">
          <input
            type="text"
            placeholder="Buscar socio por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => setShowRegisterModal(true)} 
            className="btn-primary"
            style={{ width: 'auto', padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            + Nuevo Registro (Con Pago)
          </button>
        </div>

        {/* Tabla: Socios Próximos a Vencer */}
        <div className="card-full" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#f59e0b' }}>Socios Próximos a Vencer (Menos de 7 Días)</h3>
          <div className="table-container">
            <table className="professional-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Membresía</th>
                  <th>Fecha de Terminación</th>
                  <th>Días Restantes</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.expiringSoonList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                      No hay socios próximos a vencer en esta semana.
                    </td>
                  </tr>
                ) : (
                  dashboardData.expiringSoonList.map((member) => (
                    <tr key={member.id_socio_membresia}>
                      <td><strong>{member.nombre} {member.apellido}</strong><br /><small>{member.correo}</small></td>
                      <td>{member.membresia_nombre}</td>
                      <td>{member.fecha_fin?.split('T')[0]}</td>
                      <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>{member.dias_restantes} días</span></td>
                      <td>
                        <button className="icon-btn" onClick={() => handleSendNotification(member)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                          Aviso
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: Nuevo Registro */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Registrar Nuevo Socio y Pago Inicial</h3>
            <form onSubmit={handleRegisterSubmit} className="form-group-vertical">
              <div className="input-wrapper">
                <label>Nombre(s)</label>
                <input
                  type="text"
                  placeholder="Ej. Juan"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="input-wrapper">
                <label>Apellido(s)</label>
                <input
                  type="text"
                  placeholder="Ej. Pérez"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="input-wrapper">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="input-wrapper">
                <label>Teléfono</label>
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="input-wrapper">
                <label>Tipo de Membresía</label>
                <select
                  value={form.id_membresia}
                  onChange={(e) => {
                    const id = e.target.value;
                    const encontrada = membresiasCatalogo.find(m => m.id_membresia.toString() === id);
                    if (encontrada) {
                      setForm({ 
                        ...form, 
                        id_membresia: id, 
                        monto: encontrada.precio, 
                        duracion_dias: encontrada.duracion_dias 
                      });
                    }
                  }}
                  className="input-field"
                >
                  {membresiasCatalogo.map(m => (
                    <option key={m.id_membresia} value={m.id_membresia}>
                      {m.nombre} ({m.duracion_dias} días) - ${m.precio}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-wrapper">
                <label>Método de Pago</label>
                <select
                  value={form.metodo_pago}
                  onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                  className="input-field"
                >
                  <option value="tarjeta">Tarjeta</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="deposito">Depósito</option>
                </select>
              </div>
              <div className="input-wrapper">
                <label>Fecha de Inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="input-wrapper">
                <label>Monto Pagado ($)</label>
                <input
                  type="text"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;