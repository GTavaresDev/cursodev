const dotenv = require("dotenv");
const { Client } = require("pg");

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
  await cleanDatabase();
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

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("when there are pending migrations", () => {
      test("should return 201", async () => {
        const BASE =
          process.env.TEST_BASE_URL ||
          `http://localhost:${process.env.TEST_PORT || 4000}`;
        const response = await fetch(`${BASE}/api/v1/migrations`, {
          method: "POST",
        });
        expect(response.status).toBe(201);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);

        const statusResponseAfterFirstPost = await fetch(
          `${BASE}/api/v1/status`,
        );
        expect(statusResponseAfterFirstPost.status).toBe(200);

        const statusBodyAfterFirstPost =
          await statusResponseAfterFirstPost.json();
        expect(
          statusBodyAfterFirstPost.dependencies.database.opened_connections,
        ).toBe(1);
      });
    });

    describe("when there are no pending migrations", () => {
      test("should return 200 and an empty array", async () => {
        const BASE =
          process.env.TEST_BASE_URL ||
          `http://localhost:${process.env.TEST_PORT || 4000}`;

        await fetch(`${BASE}/api/v1/migrations`, {
          method: "POST",
        });

        const response2 = await fetch(`${BASE}/api/v1/migrations`, {
          method: "POST",
        });
        expect(response2.status).toBe(200);

        const responseBody2 = await response2.json();
        expect(Array.isArray(responseBody2)).toBe(true);
        expect(responseBody2).toEqual([]);

        const statusResponseAfterSecondPost = await fetch(
          `${BASE}/api/v1/status`,
        );
        expect(statusResponseAfterSecondPost.status).toBe(200);

        const statusBodyAfterSecondPost =
          await statusResponseAfterSecondPost.json();
        expect(
          statusBodyAfterSecondPost.dependencies.database.opened_connections,
        ).toBe(1);
      });
    });
  });
});
