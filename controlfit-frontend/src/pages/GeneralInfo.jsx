import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import '../css/GeneralInfo.css';

// Registramos los componentes necesarios de Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GeneralInfo() {
  const [metrics, setMetrics] = useState({
    active: 0,
    inactive: 0,
    expiringSoon: 0,
    membershipDistribution: []
  });
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Error al actualizar datos en tiempo real:', error);
    }
  };

  useEffect(() => {
    // Carga inicial
    fetchDashboardData();

    // Actualización automática en tiempo real cada 10 segundos
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Configuración de datos para la Gráfica de Dona (Distribución de Membresías)
  const doughnutData = {
    labels: metrics.membershipDistribution?.map(item => item.membresia) || [],
    datasets: [
      {
        data: metrics.membershipDistribution?.map(item => item.total) || [],
        backgroundColor: ['#00efff', '#ff6384', '#ffce56', '#36a2eb', '#9966ff'],
        borderWidth: 1,
      },
    ],
  };

  // Configuración de datos para la Gráfica de Barras (Activos vs Inactivos)
  const barData = {
    labels: ['Activos', 'Inactivos', 'Próximos a Vencer'],
    datasets: [
      {
        label: 'Cantidad de Socios',
        data: [metrics.active, metrics.inactive, metrics.expiringSoon],
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ffffff' }
      }
    },
    scales: {
      x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div className="general-info-container">
      <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2>Información General y Monitoreo</h2>
        <span className="live-badge" style={{ fontSize: '12px', background: 'rgba(0, 239, 255, 0.1)', color: '#00efff', padding: '6px 12px', borderRadius: '20px', border: '1px solid #00efff' }}>
          🟢 En vivo (Última actualización: {lastUpdate || 'Cargando...'})
        </span>
      </div>
      
      {/* Tarjetas de Indicadores */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Socios Activos</h3>
          <p className="metric-value" style={{ color: '#28a745' }}>{metrics.active}</p>
        </div>
        <div className="metric-card">
          <h3>Socios Inactivos</h3>
          <p className="metric-value" style={{ color: '#dc3545' }}>{metrics.inactive}</p>
        </div>
        <div className="metric-card">
          <h3>Próximos a Vencer</h3>
          <p className="metric-value" style={{ color: '#ffc107' }}>{metrics.expiringSoon}</p>
        </div>
      </div>

      {/* Sección de Gráficas */}
      <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        <div className="chart-card" style={{ background: '#1e1e2d', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', height: '350px' }}>
          <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '15px' }}>Estado General de Socios</h3>
          <div style={{ height: '270px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card" style={{ background: '#1e1e2d', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', height: '350px' }}>
          <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '15px' }}>Distribución por Tipo de Membresía</h3>
          <div style={{ height: '270px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#ffffff' } } } }} />
          </div>
        </div>

      </div>
    </div>
  );
}