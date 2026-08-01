const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer"); // <--- Nueva librería requerida
require("dotenv").config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Importar rutas
const mainRoutes = require("./routes/main.routes");
const memberRoutes = require("./routes/member.routes");
const paymentRoutes = require('./routes/payment.routes');

// Definir rutas base de la API
app.use("/api", mainRoutes);
app.use("/api/members", memberRoutes);
app.use('/api/payments', paymentRoutes);

// ==========================================
// CONFIGURACIÓN DEL WEB SERVICE DE CORREOS
// ==========================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER || 'tu-correo@gmail.com',
    pass: process.env.SMTP_PASS || 'tu-password-de-aplicacion'
  }
});

// Endpoint web service para enviar aviso automático
app.post('/api/enviar-aviso-correo', async (req, res) => {
  try {
    const { email, socioId, nombreSocio, membresiaNombre, diasRestantes } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'El correo electrónico del socio es obligatorio.' 
      });
    }

    const mailOptions = {
      from: '"ControlFit Gym" <no-reply@controlfit.com>',
      to: email,
      subject: '⚠️ Aviso Importante: Tu membresía está próxima a vencer',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f7; border-radius: 8px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #00efff; background: #1e1e2d; padding: 15px; text-align: center; border-radius: 6px; margin-top: 0; color: #ffffff;">ControlFit Gym</h2>
            <p>Hola <strong>${nombreSocio || 'Socio'}</strong>,</p>
            <p>Te recordamos que tu membresía <strong>${membresiaNombre || 'actual'}</strong> está a punto de vencer en un plazo de <strong>${diasRestantes || 'pocos'} días</strong>.</p>
            <p>Para evitar interrupciones en el acceso a nuestras instalaciones, te invitamos a realizar tu renovación a tiempo.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tu-gimnasio.com/renovacion" style="background-color: #00efff; color: #121216; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Renovar Membresía</a>
            </div>
            <p style="font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">Este es un mensaje automático generado por el sistema de ControlFit. Por favor, no respondas a este correo.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Correo de aviso enviado exitosamente a ${email}`
    });

  } catch (error) {
    console.error('Error al enviar el correo automático:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al procesar el envío del correo.',
      error: error.message
    });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Servidor backend ControlFit corriendo en http://localhost:${PORT}`,
  );
});