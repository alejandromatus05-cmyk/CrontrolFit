import React from "react";
import { Home, Users, BarChart2, LogOut } from "lucide-react";
import "../css/Sidebar.css";

export default function Sidebar({ setActivePage, setAuth }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ControlFit</h2>
        <p>Panel de Administración</p>
      </div>

      <nav className="sidebar-nav">
        <button onClick={() => setActivePage("dashboard")} className="nav-btn">
          <Home size={20} /> Inicio
        </button>
        <button onClick={() => setActivePage("members")} className="nav-btn">
          <Users size={20} /> Control de Socios
        </button>
        <button
          onClick={() => setActivePage("general-info")}
          className="nav-btn"
        >
          <BarChart2 size={20} /> Información General
        </button>
      </nav>

      <div className="sidebar-footer">
        <button onClick={() => setAuth(false)} className="btn-logout">
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
