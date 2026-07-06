import retry from "async-retry";

import orchestrator from "tests/orchestrator.js";

const MAILCATCHER_BASE_URL = "http://localhost:1080";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await clearMailCatcherMessages();
});

describe("POST /api/v1/emails", () => {
  describe("Anonymous user", () => {
    test("With valid data", async () => {
      const timestamp = Date.now();
      const testEmails = [
        {
          from: "Curso.dev <contato@curso.dev>",
          to: "User One <user.one@curso.dev>",
          subject: `Email test 1 ${timestamp}`,
          text: "Mensagem de teste 1.",
        },
        {
          from: "Curso.dev <contato@curso.dev>",
          to: "User Two <user.two@curso.dev>",
          subject: `Email test 2 ${timestamp}`,
          text: "Mensagem de teste 2.",
        },
        {
          from: "Curso.dev <contato@curso.dev>",
          to: "User Three <user.three@curso.dev>",
          subject: `Email test 3 ${timestamp}`,
          text: "Mensagem de teste 3.",
        },
      ];

      const messagesBeforeSendingEmails = await fetchMessages();
      expect(messagesBeforeSendingEmails).toHaveLength(0);

      for (const testEmail of testEmails) {
        const response = await fetch("http://localhost:3000/api/v1/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testEmail),
        });

        expect(response.status).toBe(201);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          from: testEmail.from,
          to: testEmail.to,
          subject: testEmail.subject,
        });
      }

      for (const testEmail of testEmails) {
        const receivedEmail = await findEmailBySubject(testEmail.subject);

        expect(receivedEmail.sender).toBe("<contato@curso.dev>");
        expect(receivedEmail.recipients).toContain(
          `<${extractEmailAddress(testEmail.to)}>`,
        );
        expect(receivedEmail.subject).toBe(testEmail.subject);
      }

      const messagesAfterSendingEmails = await fetchMessages();
      expect(messagesAfterSendingEmails).toHaveLength(3);
    });

    test("Without text or html", async () => {
      const response = await fetch("http://localhost:3000/api/v1/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "user@curso.dev",
          subject: "Assunto sem corpo",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O campo 'text' ou 'html' é obrigatório.",
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
      });
    });
  });
});

async function clearMailCatcherMessages() {
  const response = await fetch(`${MAILCATCHER_BASE_URL}/messages`, {
    method: "DELETE",
  });

  if (response.status !== 204) {
    throw new Error("Não foi possível limpar as mensagens do MailCatcher.");
  }
}

async function findEmailBySubject(subject) {
  return await retry(
    async () => {
      const messages = await fetchMessages();
      const message = messages.find((message) => message.subject === subject);

      if (!message) {
        throw new Error(`Email com assunto "${subject}" não encontrado.`);
      }

      return message;
    },
    {
      retries: 10,
      maxTimeout: 1000,
    },
  );
}

async function fetchMessages() {
  const response = await fetch(`${MAILCATCHER_BASE_URL}/messages`);

  if (response.status !== 200) {
    throw new Error("MailCatcher indisponível.");
  }

  return await response.json();
}

function extractEmailAddress(value) {
  const emailBetweenAngleBrackets = value.match(/<([^>]+)>/);

  return emailBetweenAngleBrackets ? emailBetweenAngleBrackets[1] : value;
}
