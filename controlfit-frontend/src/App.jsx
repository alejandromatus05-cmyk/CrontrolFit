import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import GeneralInfo from "./pages/GeneralInfo";

// Importación de estilos globales y de la aplicación
import "./css/index.css";
import "./css/App.css";

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  
  // Inicia siempre en 'dashboard' tras el login o al iniciar por primera vez
  const [activePage, setActivePage] = useState('dashboard');
  
  const [loadingApp, setLoadingApp] = useState(true);

  // Al recargar la página, comprobamos si ya hay una sesión guardada en el navegador
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuarioGym');
    
    if (usuarioGuardado) {
      try {
        const parsedUser = JSON.parse(usuarioGuardado);
        setUser(parsedUser);
        setIsAuth(true);
      } catch (e) {
        console.error("Error al leer la sesión guardada:", e);
        localStorage.removeItem('usuarioGym');
      }
    }
    setLoadingApp(false);
  }, []);

  // Función para cambiar de página y guardarla en el localStorage
  const handlePageChange = (page) => {
    setActivePage(page);
    localStorage.setItem('activeGymPage', page);
  };

  // Función para cerrar sesión por completo
  const handleLogout = (authStatus) => {
    if (!authStatus) {
      localStorage.removeItem('usuarioGym');
      localStorage.removeItem('activeGymPage');
      setUser(null);
      setIsAuth(false);
      setActivePage('dashboard');
    }
  };

  // Mostrar un indicador breve mientras verifica la sesión guardada
  if (loadingApp) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh', fontSize: '18px' }}>Cargando sesión...</div>;
  }

  // Si no ha iniciado sesión, renderiza únicamente el componente de Login
  if (!isAuth) {
    return (
      <Login
        onLoginSuccess={(userData) => {
          localStorage.setItem('usuarioGym', JSON.stringify(userData));
          setUser(userData);
          setIsAuth(true);
          setActivePage('dashboard');
        }}
      />
    );
  }

  // Si ya inició sesión, renderiza el panel administrativo completo abriendo primero el Dashboard
  return (
    <div className="app-container">
      <Sidebar setActivePage={handlePageChange} setAuth={handleLogout} />

      <main className="main-content">
        {activePage === "dashboard" && <Dashboard user={user} />}
        {activePage === "members" && <Members />}
        {activePage === "general-info" && <GeneralInfo />}
      </main>
    </div>
  );
}