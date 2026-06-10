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

async function createUser(userData) {
  const response = await fetch(`${BASE}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  expect(response.status).toBe(201);
  return response.json();
}

async function getSessionsFromDatabaseByUserId(userId) {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    const result = await client.query(
      `SELECT id, user_id, token, expires_at, created_at, updated_at FROM sessions WHERE user_id = $1`,
      [userId],
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    describe("when logging in with valid credentials", () => {
      test("should return 201, user data and set session cookie", async () => {
        const user = await createUser({
          email: "login@example.com",
          username: "login-user",
          password: "password123",
        });

        const response = await fetch(`${BASE}/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "LOGIN@EXAMPLE.COM",
            password: "password123",
          }),
        });

        expect(response.status).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at,
          updated_at: user.updated_at,
        });
        expect(responseBody).not.toHaveProperty("password");

        const setCookieHeader = response.headers.get("set-cookie");
        expect(setCookieHeader).toMatch(/^session_id=[^;]+; HttpOnly; Path=\/;/);

        const sessionsInDatabase = await getSessionsFromDatabaseByUserId(
          user.id,
        );
        expect(sessionsInDatabase).toHaveLength(1);
        expect(sessionsInDatabase[0].token).toBeTruthy();
        expect(new Date(sessionsInDatabase[0].expires_at).getTime()).toBeGreaterThan(
          Date.now(),
        );
      });
    });

    describe("when logging in with invalid credentials", () => {
      test("should return 401 when email does not exist", async () => {
        const response = await fetch(`${BASE}/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "missing@example.com",
            password: "password123",
          }),
        });

        expect(response.status).toBe(401);
        const errorBody = await response.json();
        expect(errorBody.name).toBe("UnauthorizedError");
        expect(errorBody.message).toBe("Dados de autenticação não conferem.");
      });

      test("should return 401 when password is incorrect", async () => {
        await createUser({
          email: "wrong-password@example.com",
          username: "wrong-password-user",
          password: "correct-password",
        });

        const response = await fetch(`${BASE}/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "wrong-password@example.com",
            password: "incorrect-password",
          }),
        });

        expect(response.status).toBe(401);
        const errorBody = await response.json();
        expect(errorBody.name).toBe("UnauthorizedError");
        expect(errorBody.message).toBe("Dados de autenticação não conferem.");
      });
    });
  });
});
