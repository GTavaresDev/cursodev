import retry from "async-retry";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";

const MAILCATCHER_BASE_URL = "http://localhost:1080";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("Registration flow", () => {
  describe("Anonymous user", () => {
    test("Can create an account, authenticate and retrieve current user", async () => {
      const userObject = {
        username: "registrationflow",
        email: "registration.flow@curso.dev",
        password: "senha123",
      };

      const createUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userObject),
        },
      );

      expect(createUserResponse.status).toBe(201);

      const createdUser = await createUserResponse.json();

      expect(createdUser).toEqual({
        id: createdUser.id,
        username: userObject.username,
        email: userObject.email,
        password: createdUser.password,
        features: "{}",
        created_at: createdUser.created_at,
        updated_at: createdUser.updated_at,
      });

      expect(uuidVersion(createdUser.id)).toBe(4);
      expect(Date.parse(createdUser.created_at)).not.toBeNaN();
      expect(Date.parse(createdUser.updated_at)).not.toBeNaN();
      expect(createdUser.password).not.toBe(userObject.password);

      const createSessionResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userObject.email,
            password: userObject.password,
          }),
        },
      );

      expect(createSessionResponse.status).toBe(201);

      const createdSession = await createSessionResponse.json();

      expect(createdSession).toEqual({
        id: createdSession.id,
        token: createdSession.token,
        user_id: createdUser.id,
        expires_at: createdSession.expires_at,
        created_at: createdSession.created_at,
        updated_at: createdSession.updated_at,
      });

      expect(uuidVersion(createdSession.id)).toBe(4);
      expect(Date.parse(createdSession.expires_at)).not.toBeNaN();
      expect(Date.parse(createdSession.created_at)).not.toBeNaN();
      expect(Date.parse(createdSession.updated_at)).not.toBeNaN();

      const parsedSetCookie = setCookieParser(createSessionResponse, {
        map: true,
      });

      expect(parsedSetCookie.session_id.value).toBe(createdSession.token);

      const getCurrentUserResponse = await fetch(
        "http://localhost:3000/api/v1/user",
        {
          headers: {
            Cookie: `session_id=${createdSession.token}`,
          },
        },
      );

      expect(getCurrentUserResponse.status).toBe(200);

      const currentUser = await getCurrentUserResponse.json();

      expect(currentUser).toEqual({
        id: createdUser.id,
        username: userObject.username,
        email: userObject.email,
        password: createdUser.password,
        features: "{}",
        created_at: createdUser.created_at,
        updated_at: createdUser.updated_at,
      });
    });

    test("receive activation email", async () => {
      await clearMailCatcherMessages();

      const userObject = {
        username: "activationemail",
        email: "activation.email@curso.dev",
        password: "senha123",
      };

      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userObject),
      });

      expect(response.status).toBe(201);
      const createdUser = await response.json();

      const receivedEmail = await findEmailBySubject(
        activation.ACTIVATION_EMAIL_SUBJECT,
      );
      const receivedEmailText = await fetchEmailText(receivedEmail.id);
      const activationTokenId = orchestrator.extractUUID(receivedEmailText);
      const activationUrl = extractActivationUrl(receivedEmailText);
      const activationUrlObject = new URL(activationUrl);
      const validActivationToken =
        await activation.findOneValidById(activationTokenId);

      expect(receivedEmail.sender).toBe("<noreply@tabnews.local>");
      expect(receivedEmail.recipients).toContain(`<${userObject.email}>`);
      expect(receivedEmail.subject).toBe(activation.ACTIVATION_EMAIL_SUBJECT);

      expect(activationUrlObject.origin).toBe("http://localhost:3000");
      expect(activationUrlObject.pathname).toBe(
        `/api/v1/activations/${activationTokenId}`,
      );
      expect(validActivationToken).toEqual({
        id: activationTokenId,
        token: validActivationToken.token,
        user_id: createdUser.id,
        expires_at: validActivationToken.expires_at,
        used_at: null,
        created_at: validActivationToken.created_at,
        updated_at: validActivationToken.updated_at,
      });

      expect(validActivationToken.token).toMatch(/^[a-f0-9]{96}$/);
      expect(validActivationToken.user_id).toBe(createdUser.id);
      expect(uuidVersion(validActivationToken.id)).toBe(4);
      expect(Date.parse(validActivationToken.created_at)).not.toBeNaN();
      expect(Date.parse(validActivationToken.updated_at)).not.toBeNaN();

      const tokenExpirationDate = new Date(validActivationToken.expires_at);
      const expirationDifferenceInMilliseconds =
        tokenExpirationDate - new Date(validActivationToken.created_at);

      expect(Date.parse(validActivationToken.expires_at)).not.toBeNaN();
      expect(expirationDifferenceInMilliseconds).toBeGreaterThan(
        activation.EXPIRATION_IN_MILLISECONDS - 1000,
      );
      expect(expirationDifferenceInMilliseconds).toBeLessThan(
        activation.EXPIRATION_IN_MILLISECONDS + 1000,
      );

      const getActivationResponse = await fetch(activationUrl);

      expect(getActivationResponse.status).toBe(405);

      const activationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenId}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(200);

      const activatedUser = await activationResponse.json();

      expect(activatedUser).toEqual({
        id: createdUser.id,
        username: userObject.username,
        email: userObject.email,
        password: createdUser.password,
        features: '{"activation":"active"}',
        created_at: createdUser.created_at,
        updated_at: activatedUser.updated_at,
      });

      expect(Date.parse(activatedUser.updated_at)).not.toBeNaN();

      const activatedEmail = await findEmailBySubject(
        activation.ACTIVATED_EMAIL_SUBJECT,
      );
      const activatedEmailText = await fetchEmailText(activatedEmail.id);

      expect(activatedEmail.sender).toBe("<noreply@tabnews.local>");
      expect(activatedEmail.recipients).toContain(`<${userObject.email}>`);
      expect(activatedEmail.subject).toBe(activation.ACTIVATED_EMAIL_SUBJECT);
      expect(activatedEmailText).toContain(
        "sua conta foi ativada e já está pronta para usar o sistema",
      );

      await expect(
        activation.findOneValidById(activationTokenId),
      ).rejects.toThrow("Token de ativação inválido ou expirado.");

      const repeatedActivationResponse = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenId}`,
        {
          method: "PATCH",
        },
      );

      expect(repeatedActivationResponse.status).toBe(401);

      const repeatedActivationResponseBody =
        await repeatedActivationResponse.json();

      expect(repeatedActivationResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação e tente novamente.",
        status_code: 401,
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

async function fetchEmailText(messageId) {
  const response = await fetch(
    `${MAILCATCHER_BASE_URL}/messages/${messageId}.plain`,
  );

  if (response.status !== 200) {
    throw new Error("Email indisponível no MailCatcher.");
  }

  return await response.text();
}

function extractActivationUrl(emailText) {
  const activationUrl = emailText.match(
    /http:\/\/localhost:3000\/api\/v1\/activations\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );

  if (!activationUrl) {
    throw new Error("URL de ativação não encontrada no email.");
  }

  return activationUrl[0];
}
