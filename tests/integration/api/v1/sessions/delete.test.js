const dotenv = require("dotenv");
const { Client } = require("pg");
const waitForAllServices = require("tests/orchestrator.js").default;

dotenv.config({ path: ".env.development" });

const postgresConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "local_user",
  password: String(process.env.POSTGRES_PASSWORD || "local_password"),
  database: process.env.POSTGRES_DB || "local_db",
  ssl: false,
};

const BASE =
  process.env.TEST_BASE_URL ||
  `http://localhost:${process.env.TEST_PORT || 4000}`;

beforeEach(async () => {
  await waitForAllServices();
  await cleanDatabase();
  await runMigrations();
});

async function cleanDatabase() {
  const client = new Client(postgresConfig);

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

async function countSessionsInDatabase() {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    const result = await client.query(
      `SELECT COUNT(*)::int AS total FROM sessions`,
    );
    return result.rows[0].total;
  } finally {
    await client.end();
  }
}

describe("DELETE /api/v1/sessions", () => {
  describe("Authenticated user", () => {
    test("should return 200, clear cookie and invalidate session", async () => {
      const user = await waitForAllServices.createUser({
        email: "logout-user@example.com",
        username: "logout-user",
        password: "password123",
      });

      const { sessionCookie } = await waitForAllServices.createSession({
        email: user.email,
        password: "password123",
      });

      expect(await countSessionsInDatabase()).toBe(1);

      const response = await fetch(`${BASE}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: "Sessão encerrada com sucesso.",
      });

      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain("session_id=;");
      expect(setCookieHeader).toContain("Max-Age=0");

      expect(await countSessionsInDatabase()).toBe(0);

      const getSessionResponse = await fetch(`${BASE}/api/v1/sessions`, {
        method: "GET",
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(getSessionResponse.status).toBe(401);
    });
  });
});
