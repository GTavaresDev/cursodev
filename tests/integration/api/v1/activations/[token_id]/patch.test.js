import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/activations/256bc49a-132a-42e4-8334-998fd17ee71e`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const expiredActivationToken = await activation.createToken(createdUser.id);

      jest.useRealTimers();

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação e tente novamente.",
        status_code: 401,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.createToken(createdUser.id);

      const response1 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response2.status).toBe(401);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "UnauthorizedError",
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação e tente novamente.",
        status_code: 401,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();
      const activationToken = await activation.createToken(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        password: createdUser.password,
        features:
          '{"create:session":true,"update:user":true,"activation":"active","read:session":true}',
        created_at: createdUser.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > createdUser.updated_at.toISOString()).toBe(
        true,
      );
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser);
      const activationToken = await activation.createToken(createdUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With valid token, but already logged in user trying to activate another account", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1.id);

      const user2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.createToken(user2.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1SessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: 'Usuário não possui a feature "read:activation_token".',
        action: "Solicite a liberação desta feature e tente novamente.",
        status_code: 403,
      });
    });
  });
});
