const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"La Travesía del Medio" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Recuperar contraseña — La Travesía del Medio',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #292524;">
        <h2 style="color: #92400e;">La Travesía del Medio</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Hacé clic en el botón para crear una nueva contraseña. El enlace es válido por <strong>1 hora</strong>.</p>
        <p style="margin: 32px 0;">
          <a href="${resetUrl}"
             style="background:#92400e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;">
            Restablecer contraseña
          </a>
        </p>
        <p style="font-size:13px;color:#78716c;">
          Si no solicitaste esto, podés ignorar este mensaje. Tu contraseña no cambiará.
        </p>
        <p style="font-size:13px;color:#78716c;">
          O copiá este enlace: <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
