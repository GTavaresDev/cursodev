const dotenv = require("dotenv");
const { Client } = require("pg");
const waitForAllServices = require("tests/orchestrator.js").default;
const passwordService = require("models/password.js").default;

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

async function createSession({ email, password }) {
  const response = await fetch(`${BASE}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(response.status).toBe(201);

  const setCookieHeader = response.headers.get("set-cookie");
  return setCookieHeader?.split(";")[0] || null;
}

async function getUserFromDatabaseByUsername(username) {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    const result = await client.query(
      `SELECT id, email, username, password, created_at, updated_at FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username],
    );
    return result.rows[0] || null;
  } finally {
    await client.end();
  }
}

describe("PATCH /api/v1/users/[username]", () => {
  test("should update only email", async () => {
    await createUser({
      email: "old-email@example.com",
      username: "patch-email-user",
      password: "password123",
    });

    const sessionCookie = await createSession({
      email: "old-email@example.com",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/patch-email-user`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ email: "NEW-EMAIL@EXAMPLE.COM" }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.email).toBe("new-email@example.com");
    expect(responseBody.username).toBe("patch-email-user");

    const userInDatabase =
      await getUserFromDatabaseByUsername("patch-email-user");
    expect(userInDatabase.email).toBe("new-email@example.com");
  });

  test("should update only username", async () => {
    await createUser({
      email: "update-username@example.com",
      username: "before-update",
      password: "password123",
    });

    const sessionCookie = await createSession({
      email: "update-username@example.com",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/before-update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ username: "After-Update" }),
    });

    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.username).toBe("after-update");

    const oldUserInDatabase =
      await getUserFromDatabaseByUsername("before-update");
    expect(oldUserInDatabase).toBeNull();

    const updatedUserInDatabase =
      await getUserFromDatabaseByUsername("after-update");
    expect(updatedUserInDatabase).not.toBeNull();
    expect(updatedUserInDatabase.username).toBe("after-update");
  });

  test("should update only password and keep it hashed", async () => {
    await createUser({
      email: "update-password@example.com",
      username: "password-user",
      password: "old-password",
    });

    const sessionCookie = await createSession({
      email: "update-password@example.com",
      password: "old-password",
    });

    const userBeforeUpdate =
      await getUserFromDatabaseByUsername("password-user");
    const previousPasswordHash = userBeforeUpdate.password;

    const response = await fetch(`${BASE}/api/v1/users/password-user`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ password: "new-password-123" }),
    });

    expect(response.status).toBe(200);

    const userAfterUpdate =
      await getUserFromDatabaseByUsername("password-user");
    expect(userAfterUpdate.password).not.toBe(previousPasswordHash);
    expect(userAfterUpdate.password).not.toBe("new-password-123");
    expect(
      await passwordService.compare(
        "new-password-123",
        userAfterUpdate.password,
      ),
    ).toBe(true);
  });

  test("should return 409 when updating email to an already used one", async () => {
    await createUser({
      email: "owner1@example.com",
      username: "owner1",
      password: "password123",
    });

    await createUser({
      email: "owner2@example.com",
      username: "owner2",
      password: "password123",
    });

    const sessionCookie = await createSession({
      email: "owner2@example.com",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/owner2`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ email: "OWNER1@EXAMPLE.COM" }),
    });

    expect(response.status).toBe(409);
    const errorBody = await response.json();
    expect(errorBody.name).toBe("ValidationError");
    expect(errorBody.message).toBe(
      "O email informado a esta sendo ultilizado.",
    );
  });

  test("should return 409 when updating username to an already used one", async () => {
    await createUser({
      email: "username-owner1@example.com",
      username: "username-owner1",
      password: "password123",
    });

    await createUser({
      email: "username-owner2@example.com",
      username: "username-owner2",
      password: "password123",
    });

    const sessionCookie = await createSession({
      email: "username-owner2@example.com",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/username-owner2`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ username: "USERNAME-OWNER1" }),
    });

    expect(response.status).toBe(409);
    const errorBody = await response.json();
    expect(errorBody.name).toBe("ValidationError");
    expect(errorBody.message).toBe(
      "O username informado a esta sendo ultilizado.",
    );
  });

  test("should return 401 when authenticated user was deleted from database", async () => {
    await createUser({
      email: "ghost-user@example.com",
      username: "ghost-user",
      password: "password123",
    });

    const sessionCookie = await createSession({
      email: "ghost-user@example.com",
      password: "password123",
    });

    const client = new Client(postgresConfig);
    await client.connect();
    try {
      await client.query(`DELETE FROM users WHERE LOWER(username) = LOWER($1)`, [
        "ghost-user",
      ]);
    } finally {
      await client.end();
    }

    const response = await fetch(`${BASE}/api/v1/users/ghost-user`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ email: "nobody@example.com" }),
    });

    expect(response.status).toBe(401);
    const errorBody = await response.json();
    expect(errorBody.name).toBe("UnauthorizedError");
  });

  test("should return 401 when user is not authenticated", async () => {
    await createUser({
      email: "unauthenticated@example.com",
      username: "unauthenticated-user",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/unauthenticated-user`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new-email@example.com" }),
    });

    expect(response.status).toBe(401);
    const errorBody = await response.json();
    expect(errorBody.name).toBe("UnauthorizedError");
    expect(errorBody.message).toBe("Usuário não autenticado.");
  });

  test("should return 403 when authenticated user tries to update another user", async () => {
    await createUser({
      email: "user-a@example.com",
      username: "user-a",
      password: "password123",
    });

    await createUser({
      email: "user-b@example.com",
      username: "user-b",
      password: "password123",
    });

    const sessionCookie = await createSession({
      email: "user-a@example.com",
      password: "password123",
    });

    const response = await fetch(`${BASE}/api/v1/users/user-b`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ email: "hacked@example.com" }),
    });

    expect(response.status).toBe(403);
    const errorBody = await response.json();
    expect(errorBody.name).toBe("ForbiddenError");
    expect(errorBody.message).toBe(
      "Você não tem permissão para atualizar este usuário.",
    );
  });
});
