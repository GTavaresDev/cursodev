const dotenv = require("dotenv");
const { Client } = require("pg");
const waitForAllServices = require("tests/orchestrator.js").default;
const password = require("models/password.js").default;

dotenv.config({ path: ".env.development" });

const postgresConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "local_user",
  password: String(process.env.POSTGRES_PASSWORD || "local_password"),
  database: process.env.POSTGRES_DB || "local_db",
  ssl: false,
};

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
  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;
  await fetch(`${BASE}/api/v1/migrations`, {
    method: "POST",
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

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    describe("when creating a valid user", () => {
      test("should return 201 and the created user", async () => {
        const BASE =
          process.env.TEST_BASE_URL ||
          `http://localhost:${process.env.TEST_PORT || 4000}`;
        const userData = {
          email: "test@example.com",
          username: "testuser",
          password: "securePassword123",
        };

        const response = await fetch(`${BASE}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        expect(response.status).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty("id");
        expect(responseBody.email).toBe(userData.email);
        expect(responseBody.username).toBe(userData.username);
        expect(responseBody).not.toHaveProperty("password");

        // Verify exactly what was stored in the database
        const userInDatabase = await getUserFromDatabase(userData.email);
        expect(userInDatabase).not.toBeNull();
        expect(userInDatabase.id).toBe(responseBody.id);
        expect(userInDatabase.email).toBe(userData.email);
        expect(userInDatabase.username).toBe(userData.username);
        expect(userInDatabase.password).not.toBe(userData.password);
        expect(
          await password.compare(userData.password, userInDatabase.password),
        ).toBe(true);
        expect(userInDatabase.created_at).toBeTruthy();
        expect(userInDatabase.updated_at).toBeTruthy();
      });

      test("should insert user directly in database with SQL query", async () => {
        const insertedUser = await insertUserDirectly(
          "direct@example.com",
          "directuser",
          "hashedPassword456",
        );

        expect(insertedUser).toHaveProperty("id");
        expect(insertedUser.email).toBe("direct@example.com");
        expect(insertedUser.username).toBe("directuser");
        expect(insertedUser).not.toHaveProperty("password");
        console.log("Inserted user directly into database:", insertedUser);
      });
    });

    describe("when creating a duplicate email user", () => {
      test("should return 409 when email already exists (case-insensitive)", async () => {
        const BASE =
          process.env.TEST_BASE_URL ||
          `http://localhost:${process.env.TEST_PORT || 4000}`;

        // First user
        const firstUser = {
          email: "duplicate@example.com",
          username: "firstuser",
          password: "password123",
        };

        const firstResponse = await fetch(`${BASE}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(firstUser),
        });
        expect(firstResponse.status).toBe(201);

        // Second user with same email (different case)
        const secondUser = {
          email: "DUPLICATE@EXAMPLE.COM",
          username: "seconduser",
          password: "password456",
        };

        const secondResponse = await fetch(`${BASE}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(secondUser),
        });
        expect(secondResponse.status).toBe(409);

        const errorBody = await secondResponse.json();
        expect(errorBody.name).toBe("ValidationError");
        expect(errorBody.statusCode).toBe(409);
        expect(errorBody.message).toBe(
          "O email informado a esta sendo ultilizado.",
        );
        expect(errorBody.action).toBe(
          "Utilize outro email para realizar o cadastro",
        );
      });
    });

    describe("when creating a duplicate username user", () => {
      test("should return 409 when username already exists (case-insensitive)", async () => {
        const BASE =
          process.env.TEST_BASE_URL ||
          `http://localhost:${process.env.TEST_PORT || 4000}`;

        const firstUser = {
          email: "first-username@example.com",
          username: "duplicateusername",
          password: "password123",
        };

        const firstResponse = await fetch(`${BASE}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(firstUser),
        });
        expect(firstResponse.status).toBe(201);

        const secondUser = {
          email: "second-username@example.com",
          username: "DUPLICATEUSERNAME",
          password: "password456",
        };

        const secondResponse = await fetch(`${BASE}/api/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(secondUser),
        });
        expect(secondResponse.status).toBe(409);

        const errorBody = await secondResponse.json();
        expect(errorBody.name).toBe("ValidationError");
        expect(errorBody.statusCode).toBe(409);
        expect(errorBody.message).toBe(
          "O username informado a esta sendo ultilizado.",
        );
        expect(errorBody.action).toBe(
          "Utilize outro username para realizar o cadastro",
        );
      });
    });
  });
});
