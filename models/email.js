import nodemailer from "nodemailer";

import { ServiceError, ValidationError } from "infra/errors.js";

const DEFAULT_SMTP_HOST = "localhost";
const DEFAULT_SMTP_PORT = 1025;
const DEFAULT_FROM = "TabNews <noreply@tabnews.local>";

async function send({ from = DEFAULT_FROM, to, subject, text, html }) {
  validateRequiredFields({ to, subject, text, html });

  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw new ServiceError({
      cause: error,
      message: "Não foi possível enviar o email.",
      context: {
        provider: "nodemailer",
        host,
        port,
        from,
        to,
        subject,
      },
    });
  }

  return {
    from,
    to,
    subject,
  };
}

function validateRequiredFields({ to, subject, text, html }) {
  if (!to) {
    throw new ValidationError({
      message: "O campo 'to' é obrigatório.",
    });
  }

  if (!subject) {
    throw new ValidationError({
      message: "O campo 'subject' é obrigatório.",
    });
  }

  if (!text && !html) {
    throw new ValidationError({
      message: "O campo 'text' ou 'html' é obrigatório.",
    });
  }
}

const email = {
  send,
};

export default email;
