import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Users,
  UserX,
  AlertTriangle,
  Search,
  CreditCard,
  X,
  CheckCircle,
  FileText,
  Printer,
  Mail,
  DollarSign,
} from "lucide-react";
import "../css/Dashboard.css";

export default function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Estado para el modal de historial de pagos
  const [showPagosModal, setShowPagosModal] = useState(false);
  const [historialPagos, setHistorialPagos] = useState([]);

  // Estados para el Modal de Voucher / Facturación
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

  // Estados para el Modal de Formulario de Pago a Socios por Vencer
  const [showPagoFormModal, setShowPagoFormModal] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoPago, setMontoPago] = useState("");
  const [mensajeNotificacion, setMensajeNotificacion] = useState("");

  // Estados para las membresías reales de la base de datos
  const [membresiasDisponibles, setMembresiasDisponibles] = useState([]);
  const [membresiaSeleccionadaId, setMembresiaSeleccionadaId] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.getDashboard();
      if (response.success) {
        setData(response);
      }
    } catch (error) {
      console.error("Error al cargar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirHistorialPagos = async () => {
    try {
      const res = await api.getPagosHistorial();
      if (res.status === "success") {
        setHistorialPagos(res.data);
      } else {
        setHistorialPagos([]);
      }
    } catch (e) {
      console.error("Error al obtener historial de pagos:", e);
      setHistorialPagos([]);
    }
    setShowPagosModal(true);
  };

  // Función para confirmar pago pendiente y actualizar fechas automáticamente
  const confirmarPago = async (idPago) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/payments/${idPago}/confirmar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        },
      );
      const result = await res.json();

      if (res.ok && result.status === "success") {
        setHistorialPagos((prev) =>
          prev.map((p) =>
            p.id_pago === idPago || p.id === idPago
              ? { ...p, estado: "pagado" }
              : p,
          ),
        );
        setMensajeNotificacion(
          "¡Pago confirmado y fechas de membresía actualizadas con éxito!",
        );
        fetchDashboardData();
        setTimeout(() => setMensajeNotificacion(""), 4000);
      } else {
        alert("Error al confirmar: " + (result.message || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error al confirmar el pago:", error);
    }
  };

  const abrirVoucher = (pago) => {
    setPagoSeleccionado(pago);
    setShowVoucherModal(true);
  };

  const enviarCorreoAviso = async (socio) => {
    try {
      const emailDestino = socio.email || socio.correo || "socio@correo.com";
      if (api.enviarCorreoAviso) {
        await api.enviarCorreoAviso({ email: emailDestino, socioId: socio.id });
      }
      setMensajeNotificacion(`¡Aviso enviado con éxito a ${emailDestino}!`);
      setTimeout(() => setMensajeNotificacion(""), 4000);
    } catch (error) {
      console.error("Error al enviar correo de aviso:", error);
      setMensajeNotificacion("Error al enviar el correo de aviso.");
      setTimeout(() => setMensajeNotificacion(""), 4000);
    }
  };

  // Abrir formulario de pago cargando las membresías directamente desde el backend/base de datos
  const abrirFormularioPago = async (socio) => {
    setSocioSeleccionado(socio);
    setMetodoPago("efectivo");
    setMembresiaSeleccionadaId(socio.id_membresia || socio.membresia_id || "1");

    try {
      // Petición real al backend para obtener las membresías de la tabla 'membresias'
      const response = await fetch("http://localhost:3000/api/membresias");
      const result = await response.json();

      const listaMembresias = result.data || result;
      setMembresiasDisponibles(listaMembresias);

      // Asignar precio inicial basado en la membresía actual del socio o la primera disponible
      const memActual =
        listaMembresias.find(
          (m) =>
            String(m.id) === String(socio.id_membresia || socio.membresia_id),
        ) || listaMembresias[0];
      if (memActual) {
        setMontoPago(memActual.precio);
        setMembresiaSeleccionadaId(memActual.id);
      } else {
        setMontoPago(socio.precio || "300.00");
      }
    } catch (e) {
      console.error("Error al cargar membresías de la BD:", e);
      // Fallback seguro si falla la red basado en tu BD real
      setMembresiasDisponibles([
        { id: 1, nombre: "Mensual", precio: 300, duracion_days: 30 },
        { id: 2, nombre: "Anual", precio: 3600, duracion_days: 365 },
      ]);
      setMontoPago("300.00");
    }

    setShowPagoFormModal(true);
  };

  // Registrar el pago enviando los datos correspondientes
  const procesarPagoSocio = async (e) => {
    e.preventDefault();
    try {
      const estadoInicial = metodoPago === "tarjeta" ? "pagado" : "pendiente";
      const membresiaObj = membresiasDisponibles.find(
        (m) => String(m.id) === String(membresiaSeleccionadaId),
      );

      const nuevoPagoData = {
        member_id: socioSeleccionado.id || socioSeleccionado.socio_id,
        membership_id: membresiaSeleccionadaId,
        amount_paid: montoPago,
        duration_days:
          membresiaObj?.duracion_days || membresiaObj?.duration_days || 30,
        payment_method: metodoPago,
        estado: estadoInicial,
      };

      const response = await fetch("http://localhost:3000/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoPagoData),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setMensajeNotificacion(
          `¡Pago registrado con éxito! Estado: ${estadoInicial.toUpperCase()}`,
        );
        setShowPagoFormModal(false);
        fetchDashboardData();
        setTimeout(() => setMensajeNotificacion(""), 4000);
      } else {
        alert("Error: " + (result.message || "No se pudo registrar el pago"));
      }
    } catch (error) {
      console.error("Error al procesar el pago:", error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">Cargando panel de control...</div>
    );
  }

  const listaFiltrada =
    data?.expiringSoonList?.filter((item) =>
      `${item.nombre} ${item.apellido}`
        .toLowerCase()
        .includes(busqueda.toLowerCase()),
    ) || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-top-bar">
        <div className="dashboard-header-flex">
          <div>
            <h2>Resumen y Estado del Gimnasio</h2>
            <div className="user-welcome-badge">
              <span className="welcome-label">Bienvenido,</span>
              <span className="welcome-name">
                {user?.nombre || "Alejandro"}
              </span>
              <span className="role-divider">|</span>
              <span className="role-text">
                Rol: {user?.rol || "Administrador"}
              </span>
            </div>
          </div>
        </div>
        <button onClick={abrirHistorialPagos} className="btn-historial-pagos">
          <CreditCard size={18} /> Historial de Pagos
        </button>
      </div>

      {mensajeNotificacion && (
        <div
          style={{
            backgroundColor: "#2ed573",
            color: "#121216",
            padding: "12px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {mensajeNotificacion}
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={28} />
          </div>
          <div>
            <h3>Socios Activos</h3>
            <p>{data?.metrics?.active || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <UserX size={28} />
          </div>
          <div>
            <h3>Socios Inactivos</h3>
            <p>{data?.metrics?.inactive || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3>Por Vencer (7 días)</h3>
            <p>{data?.metrics?.expiringSoon || 0}</p>
          </div>
        </div>
      </div>

      <div className="section-box">
        <div className="section-header-flex">
          <h3>⚠️ Membresías Próximas a Vencer</h3>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar socio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {listaFiltrada.length === 0 ? (
          <div className="no-data-box">
            <p>No hay membresías por vencer por el momento.</p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Membresía</th>
                  <th>Vence el</th>
                  <th>Días restantes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.nombre} {item.apellido}
                    </td>
                    <td>{item.membresia_nombre}</td>
                    <td>{item.fecha_fin.split("T")[0]}</td>
                    <td>
                      <span className="badge-warning">
                        {item.dias_restantes} días
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="btn-email-warning"
                          title="Enviar correo de aviso automático"
                          onClick={() => enviarCorreoAviso(item)}
                        >
                          <Mail
                            size={14}
                            style={{
                              marginRight: "4px",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          Aviso
                        </button>
                        <button
                          className="btn-pay-membership"
                          title="Realizar pago de membresía"
                          onClick={() => abrirFormularioPago(item)}
                        >
                          <DollarSign
                            size={14}
                            style={{
                              marginRight: "2px",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          Pagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPagosModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Historial General de Pagos</h3>
              <button
                onClick={() => setShowPagosModal(false)}
                className="close-modal-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {historialPagos.length === 0 ? (
                <p className="no-data">No hay registros de pagos recientes.</p>
              ) : (
                <div className="modal-table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Socio</th>
                        <th>Membresía</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialPagos.map((pago, i) => {
                        const estadoPago = pago.estado
                          ? pago.estado.toLowerCase()
                          : "pendiente";
                        const paymentId = pago.id_pago || pago.id;
                        return (
                          <tr key={i}>
                            <td>
                              {pago.nombre} {pago.apellido}
                            </td>
                            <td>{pago.nombre_membresia || "N/A"}</td>
                            <td>${pago.monto}</td>
                            <td>{pago.metodo_pago}</td>
                            <td>{pago.fecha_pago?.split("T")[0]}</td>
                            <td>
                              <span
                                className={
                                  estadoPago === "pagado"
                                    ? "badge-pagado"
                                    : "badge-pendiente"
                                }
                              >
                                {estadoPago.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons-cell">
                                {estadoPago !== "pagado" && (
                                  <button
                                    className="btn-confirm-payment"
                                    title="Confirmar Pago"
                                    onClick={() => confirmarPago(paymentId)}
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
                                  className="btn-voucher"
                                  title="Ver Voucher y Facturación"
                                  onClick={() => abrirVoucher(pago)}
                                >
                                  <FileText
                                    size={14}
                                    style={{
                                      marginRight: "4px",
                                      verticalAlign: "middle",
                                    }}
                                  />{" "}
                                  Voucher
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPagoFormModal && socioSeleccionado && (
        <div className="modal-overlay" style={{ zIndex: 1150 }}>
          <div
            className="modal-content"
            style={{ maxWidth: "420px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 style={{ color: "#00efff", margin: 0 }}>
                Registrar Pago de Membresía
              </h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowPagoFormModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form
                onSubmit={procesarPagoSocio}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <div>
                  <label style={{ fontSize: "13px", color: "#a0a0ab" }}>
                    Socio:
                  </label>
                  <p
                    style={{
                      margin: "5px 0 0 0",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    {socioSeleccionado.nombre} {socioSeleccionado.apellido}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#a0a0ab" }}>
                    Seleccionar Membresía (Base de Datos):
                  </label>
                  <select
                    value={membresiaSeleccionadaId}
                    onChange={(e) => {
                      const idMemb = e.target.value;
                      setMembresiaSeleccionadaId(idMemb);
                      const encontrada = membresiasDisponibles.find(
                        (m) => String(m.id) === String(idMemb),
                      );
                      if (encontrada) {
                        setMontoPago(encontrada.precio);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#121216",
                      border: "1px solid #2a2a3c",
                      borderRadius: "6px",
                      color: "white",
                      marginTop: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    {membresiasDisponibles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} (${m.precio} -{" "}
                        {m.duracion_days || m.duration_days} días)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#a0a0ab" }}>
                    Monto a Cobrar ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoPago}
                    onChange={(e) => setMontoPago(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#121216",
                      border: "1px solid #2a2a3c",
                      borderRadius: "6px",
                      color: "white",
                      marginTop: "5px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#a0a0ab" }}>
                    Método de Pago:
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#121216",
                      border: "1px solid #2a2a3c",
                      borderRadius: "6px",
                      color: "white",
                      marginTop: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="efectivo">
                      Efectivo (Pendiente hasta confirmar)
                    </option>
                    <option value="transferencia">
                      Transferencia (Pendiente hasta confirmar)
                    </option>
                    <option value="tarjeta">Tarjeta (Pagado Automático)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#00efff",
                    color: "#121216",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginTop: "10px",
                    fontSize: "15px",
                  }}
                >
                  Procesar y Guardar Pago
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVoucherModal && pagoSeleccionado && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-content"
            style={{ maxWidth: "480px", width: "90%" }}
          >
            <div className="modal-header">
              <h3 style={{ color: "#00efff", margin: 0 }}>
                Comprobante de Pago
              </h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowVoucherModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="voucher-container" id="printable-voucher">
                <div className="voucher-header">
                  <h2>ControlFit Gym</h2>
                  <p>Comprobante Oficial de Transacción</p>
                </div>

                <div className="voucher-body">
                  <div className="voucher-row">
                    <span>
                      <strong>Folio Operación:</strong>
                    </span>
                    <span>
                      #00
                      {pagoSeleccionado.id_pago ||
                        pagoSeleccionado.id ||
                        "1029"}
                    </span>
                  </div>
                  <div className="voucher-row">
                    <span>
                      <strong>Fecha de Emisión:</strong>
                    </span>
                    <span>{pagoSeleccionado.fecha_pago?.split("T")[0]}</span>
                  </div>
                  <div className="voucher-row">
                    <span>
                      <strong>Perfil Activo (Adm):</strong>
                    </span>
                    <span>{user?.nombre || "Administrador"}</span>
                  </div>
                  <hr
                    style={{ border: "0.5px dashed #ccc", margin: "12px 0" }}
                  />
                  <div className="voucher-row">
                    <span>
                      <strong>Titular del Socio:</strong>
                    </span>
                    <span>
                      {pagoSeleccionado.nombre} {pagoSeleccionado.apellido}
                    </span>
                  </div>
                  <div className="voucher-row">
                    <span>
                      <strong>Concepto / Membresía:</strong>
                    </span>
                    <span>{pagoSeleccionado.nombre_membresia || "N/A"}</span>
                  </div>
                  <div className="voucher-row">
                    <span>
                      <strong>Método de Pago:</strong>
                    </span>
                    <span>{pagoSeleccionado.metodo_pago}</span>
                  </div>
                  <div className="voucher-row">
                    <span>
                      <strong>Estado Actual:</strong>
                    </span>
                    <span
                      style={{
                        color:
                          pagoSeleccionado.estado === "pagado"
                            ? "#2ed573"
                            : "#ffa502",
                        fontWeight: "bold",
                      }}
                    >
                      {pagoSeleccionado.estado
                        ? pagoSeleccionado.estado.toUpperCase()
                        : "PENDIENTE"}
                    </span>
                  </div>
                  <hr
                    style={{ border: "0.5px dashed #ccc", margin: "12px 0" }}
                  />
                  <div
                    className="voucher-row"
                    style={{ fontSize: "16px", fontWeight: "bold" }}
                  >
                    <span>Total Facturado:</span>
                    <span>${pagoSeleccionado.monto}</span>
                  </div>
                </div>

                <div className="voucher-footer">
                  <p>
                    ¡Gracias por confiar en ControlFit!
                    <br />
                    Este documento avala el registro interno del pago.
                  </p>
                </div>
              </div>

              <button
                className="btn-print-voucher"
                onClick={() => window.print()}
              >
                <Printer
                  size={16}
                  style={{ marginRight: "6px", verticalAlign: "middle" }}
                />{" "}
                Imprimir Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
