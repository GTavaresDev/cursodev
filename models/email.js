import net from "node:net";

import { ServiceError, ValidationError } from "infra/errors.js";

const DEFAULT_SMTP_HOST = "localhost";
const DEFAULT_SMTP_PORT = 1025;
const DEFAULT_FROM = "TabNews <noreply@tabnews.local>";

async function send({ from = DEFAULT_FROM, to, subject, text, html }) {
  validateRequiredFields({ to, subject, text, html });

  const smtpClient = createSmtpClient();
  const message = buildMessage({ from, to, subject, text, html });

  try {
    await smtpClient.connect();
    await smtpClient.command("EHLO localhost", 250);
    await smtpClient.command(`MAIL FROM:<${extractEmailAddress(from)}>`, 250);
    await smtpClient.command(
      `RCPT TO:<${extractEmailAddress(to)}>`,
      [250, 251],
    );
    await smtpClient.command("DATA", 354);
    await smtpClient.command(`${escapeMessage(message)}\r\n.`, 250);
    await smtpClient.command("QUIT", 221);
  } catch (error) {
    throw new ServiceError({
      cause: error,
      message: "Não foi possível enviar o email.",
    });
  } finally {
    smtpClient.close();
  }

  return {
    from,
    to,
    subject,
  };
}

function createSmtpClient() {
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT);
  const socket = net.createConnection({ host, port });

  let buffer = "";
  let pendingResponse;

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");

    if (pendingResponse && responseIsComplete(buffer)) {
      const response = buffer;
      buffer = "";
      pendingResponse.resolve(response);
      pendingResponse = undefined;
    }
  });

  socket.on("error", (error) => {
    if (pendingResponse) {
      pendingResponse.reject(error);
      pendingResponse = undefined;
    }
  });

  return {
    async connect() {
      await waitForResponse([220]);
    },

    async command(command, expectedCodes) {
      socket.write(`${command}\r\n`);
      await waitForResponse(expectedCodes);
    },

    close() {
      socket.end();
      socket.destroy();
    },
  };

  async function waitForResponse(expectedCodes) {
    const response = await new Promise((resolve, reject) => {
      pendingResponse = { resolve, reject };
    });

    const codes = Array.isArray(expectedCodes)
      ? expectedCodes
      : [expectedCodes];
    const responseCode = Number(response.slice(0, 3));

    if (!codes.includes(responseCode)) {
      throw new Error(`SMTP respondeu com código inesperado: ${response}`);
    }
  }
}

function responseIsComplete(response) {
  const lines = response.split("\r\n").filter(Boolean);
  const lastLine = lines.at(-1);

  return /^\d{3} /.test(lastLine);
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

function buildMessage({ from, to, subject, text, html }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];

  if (html) {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    return `${headers.join("\r\n")}\r\n\r\n${html}`;
  }

  headers.push('Content-Type: text/plain; charset="UTF-8"');
  return `${headers.join("\r\n")}\r\n\r\n${text}`;
}

function escapeMessage(message) {
  return message.replace(/^\./gm, "..");
}

function extractEmailAddress(value) {
  const emailBetweenAngleBrackets = value.match(/<([^>]+)>/);

  return emailBetweenAngleBrackets ? emailBetweenAngleBrackets[1] : value;
}

const email = {
  send,
};

export default email;
