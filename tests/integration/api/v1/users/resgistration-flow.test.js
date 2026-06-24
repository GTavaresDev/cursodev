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

      const receivedEmail = await findEmailBySubject(
        activation.ACTIVATION_EMAIL_SUBJECT,
      );

      expect(receivedEmail.sender).toBe("<noreply@tabnews.local>");
      expect(receivedEmail.recipients).toContain(`<${userObject.email}>`);
      expect(receivedEmail.subject).toBe(activation.ACTIVATION_EMAIL_SUBJECT);
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
