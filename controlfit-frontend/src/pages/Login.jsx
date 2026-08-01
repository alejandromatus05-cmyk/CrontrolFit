import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, Mail, LogIn } from 'lucide-react';
import '../css/Login.css';

export default function Login({ onLoginSuccess }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(correo, password);
      
      if (data.success && data.user) {
        // Guardamos el rol y el ID en el localStorage para que las vistas los reconozcan
        localStorage.setItem('rol', data.user.rol);
        localStorage.setItem('userId', data.user.id_usuario);
        localStorage.setItem('userName', data.user.nombre);

        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Credenciales inválidas o usuario inactivo.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h2>ControlFit</h2>
          <p>Ingresa a tu panel de administración</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={correo} 
              onChange={(e) => setCorreo(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}