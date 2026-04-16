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

const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"La Travesía del Medio" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verificá tu cuenta — La Travesía del Medio',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #292524;">
        <h2 style="color: #92400e;">La Travesía del Medio</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Gracias por registrarte. Para activar tu cuenta hacé clic en el botón:</p>
        <p style="margin: 32px 0;">
          <a href="${verifyUrl}"
             style="background:#92400e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px;">
            Verificar mi cuenta
          </a>
        </p>
        <p style="font-size:13px;color:#78716c;">
          Si no creaste una cuenta, podés ignorar este mensaje.
        </p>
        <p style="font-size:13px;color:#78716c;">
          O copiá este enlace: <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `,
  });
};

const sendContactEmail = async ({ nombre, email, tema, mensaje }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"La Travesía del Medio" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `Contacto: ${tema || 'Nuevo mensaje'} — ${nombre}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #292524;">
        <h2 style="color: #92400e;">Nuevo mensaje de contacto</h2>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <tr><td style="padding:6px 0; color:#78716c; width:100px;">Nombre</td><td style="padding:6px 0;"><strong>${nombre}</strong></td></tr>
          <tr><td style="padding:6px 0; color:#78716c;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          ${tema ? `<tr><td style="padding:6px 0; color:#78716c;">Tema</td><td style="padding:6px 0;">${tema}</td></tr>` : ''}
        </table>
        <div style="background:#fafaf9; border:1px solid #e7e5e4; border-radius:8px; padding:16px; white-space:pre-wrap; line-height:1.6;">
${mensaje}
        </div>
        <p style="font-size:12px; color:#a8a29e; margin-top:16px;">
          Respondé directamente a este email para contactar a ${nombre}.
        </p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendContactEmail };
