const dotenv = require("dotenv");
const { Client } = require("pg");
const orchestrator = require("tests/orchestrator.js");

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
  await orchestrator.waitForAllServices();
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
  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;
  await fetch(`${BASE}/api/v1/migrations`, {
    method: "GET",
  });
}

async function insertUserDirectly(email, username, password) {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    const result = await client.query(
      `
      INSERT INTO users (email, username, password, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, email, username, created_at, updated_at
      `,
      [email, username, password],
    );
    return result.rows[0];
  } finally {
    await client.end();
  }
}

async function getUserFromDatabase(email) {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    const result = await client.query(
      `SELECT id, email, username, password, created_at, updated_at FROM users WHERE email = $1`,
      [email],
    );
    return result.rows[0] || null;
  } finally {
    await client.end();
  }
}

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    describe("when fetching a valid user", () => {
      test("should return 200 and the user data inserted directly", async () => {
        const userData = {
          email: "test@example.com",
          username: "testuser",
          password: "securePassword123",
        };

        // Insert directly into DB instead of using POST
        const inserted = await insertUserDirectly(
          userData.email,
          userData.username,
          userData.password,
        );

        expect(inserted).toHaveProperty("id");
        expect(inserted.email).toBe(userData.email);
        expect(inserted.username).toBe(userData.username);

        // Fetch the same user via GET /api/v1/users/:username
        const getResponse = await fetch(
          `${BASE}/api/v1/users/${encodeURIComponent(userData.username)}`,
        );
        expect(getResponse.status).toBe(200);
        const getBody = await getResponse.json();
        expect(getBody).toHaveProperty("id");
        expect(getBody.id).toBe(inserted.id);
        expect(getBody.email).toBe(userData.email);
        expect(getBody.username).toBe(userData.username);
        expect(getBody).not.toHaveProperty("password");
      });

      test("should match username case-insensitively", async () => {
        const ciInserted = await insertUserDirectly(
          "ci@example.com",
          "CaseUser",
          "pwd123",
        );

        expect(ciInserted).toHaveProperty("id");

        // Query using different case
        const ciResponse = await fetch(
          `${BASE}/api/v1/users/${encodeURIComponent("CASEuser")}`,
        );
        expect(ciResponse.status).toBe(200);
        const ciBody = await ciResponse.json();
        expect(ciBody).toHaveProperty("id");
        expect(ciBody.id).toBe(ciInserted.id);
        expect(ciBody.username.toLowerCase()).toBe("caseuser");
      });

      test("should return 404 when user does not exist", async () => {
        const response = await fetch(
          `${BASE}/api/v1/users/nonexistent_user_123`,
        );
        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body).toHaveProperty("message");
        expect(body.message).toBe("User not found");
      });

      test("should insert user directly in database with SQL query and fetch by GET", async () => {
        const insertedUser = await insertUserDirectly(
          "direct@example.com",
          "directuser",
          "hashedPassword456",
        );

        expect(insertedUser).toHaveProperty("id");
        expect(insertedUser.email).toBe("direct@example.com");
        expect(insertedUser.username).toBe("directuser");
        expect(insertedUser).not.toHaveProperty("password");

        // Fetch the inserted user via GET /api/v1/users/:username
        const getResponse = await fetch(
          `${BASE}/api/v1/users/${encodeURIComponent(insertedUser.username)}`,
        );
        expect(getResponse.status).toBe(200);
        const getBody = await getResponse.json();
        expect(getBody).toHaveProperty("id");
        expect(getBody.id).toBe(insertedUser.id);
        expect(getBody.email).toBe(insertedUser.email);
        expect(getBody.username).toBe(insertedUser.username);
        expect(getBody).not.toHaveProperty("password");
      });
    });
  });
});
