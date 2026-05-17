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

beforeAll(async () => {
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

test("Get to /api/v1/migrations should return 200", async () => {
  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;
  const response = await fetch(`${BASE}/api/v1/migrations`);
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  console.log("Response body:", responseBody);
  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);

  const statusResponse = await fetch(`${BASE}/api/v1/status`);
  expect(statusResponse.status).toBe(200);

  const statusBody = await statusResponse.json();
  expect(statusBody.dependencies.database.opened_connections).toBe(1);
});
