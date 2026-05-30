const dotenv = require("dotenv");
const { Client } = require("pg");
const orchestrator = require("tests/orchestrator.js").default;

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
  await orchestrator();
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

describe("GET /api/v1/users/[username]", () => {
  test("should return 200 and the user data", async () => {
    const createdUser = await orchestrator.createUser({
      email: "get-user@example.com",
      username: "Get-User",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/get-user`, {
      method: "GET",
    });

    expect(response.status).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.id).toBe(createdUser.id);
    expect(responseBody.email).toBe("get-user@example.com");
    expect(responseBody.username).toBe("get-user");
    expect(responseBody).not.toHaveProperty("password");
    expect(responseBody.created_at).toBeDefined();
    expect(responseBody.updated_at).toBeDefined();
  });

  test("should return 404 when the user does not exist", async () => {
    const response = await fetch(`${BASE}/api/v1/users/non-existent-user`, {
      method: "GET",
    });

    expect(response.status).toBe(404);

    const responseBody = await response.json();
    expect(responseBody).toEqual({ message: "User not found" });
  });
});
