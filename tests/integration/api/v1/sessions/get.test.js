const dotenv = require("dotenv");
const waitForAllServices = require("tests/orchestrator.js").default;

dotenv.config({ path: ".env.development" });

const BASE =
  process.env.TEST_BASE_URL ||
  `http://localhost:${process.env.TEST_PORT || 4000}`;

beforeEach(async () => {
  await waitForAllServices();
  await cleanDatabase();
  await runMigrations();
});

async function cleanDatabase() {
  const { Client } = require("pg");
  const client = new Client({
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || "local_user",
    password: String(process.env.POSTGRES_PASSWORD || "local_password"),
    database: process.env.POSTGRES_DB || "local_db",
    ssl: false,
  });

  await client.connect();
  try {
    await client.query("drop schema public cascade; create schema public;");
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  await fetch(`${BASE}/api/v1/migrations`, {
    method: "POST",
  });
}

describe("GET /api/v1/sessions", () => {
  describe("Authenticated user", () => {
    test("should return 200 and current user when session cookie is valid", async () => {
      const user = await waitForAllServices.createUser({
        email: "current-user@example.com",
        username: "current-user",
        password: "password123",
      });

      const { sessionCookie } = await waitForAllServices.createSession({
        email: user.email,
        password: "password123",
      });

      const response = await fetch(`${BASE}/api/v1/sessions`, {
        method: "GET",
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual(user);
      expect(responseBody).not.toHaveProperty("password");
    });
  });

  describe("Anonymous user", () => {
    test("should return 401 when session cookie is missing", async () => {
      const response = await fetch(`${BASE}/api/v1/sessions`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const errorBody = await response.json();
      expect(errorBody.name).toBe("UnauthorizedError");
      expect(errorBody.message).toBe("Usuário não autenticado.");
    });
  });
});
