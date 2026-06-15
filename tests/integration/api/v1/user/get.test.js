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

afterEach(() => {
  jest.useRealTimers();
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

function getSessionCookie(response) {
  return response.headers.get("set-cookie");
}

function getSessionIdFromCookie(cookie) {
  const sessionCookie = cookie
    .split(";")
    .find((cookiePart) => cookiePart.trim().startsWith("session_id="));

  return sessionCookie.split("=")[1];
}

async function expireSession(sessionId) {
  const client = new Client(postgresConfig);

  await client.connect();
  try {
    await client.query(
      "UPDATE sessions SET expires_at = $1, updated_at = NOW() WHERE id = $2",
      [new Date("2020-01-01T00:00:00.000Z"), sessionId],
    );
  } finally {
    await client.end();
  }
}

describe("GET /api/v1/user", () => {
  describe("Anonymous user", () => {
    test("should create a session, set a cookie and return the user", async () => {
      const response = await fetch(`${BASE}/api/v1/user`);

      expect(response.status).toBe(200);
      expect(getSessionCookie(response)).toContain("session_id=");
      expect(getSessionCookie(response)).toContain("HttpOnly");
      expect(getSessionCookie(response)).toContain("SameSite=Lax");

      const responseBody = await response.json();
      expect(responseBody).toHaveProperty("id");
      expect(responseBody.name).toBe("session_user");
      expect(responseBody.email).toBe("session-user@example.com");
      expect(new Date(responseBody.expires_at).toISOString()).toBe(
        responseBody.expires_at,
      );
      expect(responseBody).not.toHaveProperty("password");
    });

    test("should return the same user when the session cookie is valid", async () => {
      const firstResponse = await fetch(`${BASE}/api/v1/user`);
      const firstBody = await firstResponse.json();
      const cookie = getSessionCookie(firstResponse);

      const secondResponse = await fetch(`${BASE}/api/v1/user`, {
        headers: {
          Cookie: cookie,
        },
      });

      expect(secondResponse.status).toBe(200);
      expect(getSessionCookie(secondResponse)).toBeNull();

      const secondBody = await secondResponse.json();
      expect(secondBody.id).toBe(firstBody.id);
      expect(secondBody.name).toBe(firstBody.name);
      expect(secondBody.email).toBe(firstBody.email);
      expect(secondBody).not.toHaveProperty("password");
    });

    test("should create a new session when the cookie is invalid", async () => {
      const response = await fetch(`${BASE}/api/v1/user`, {
        headers: {
          Cookie: "session_id=00000000-0000-0000-0000-000000000000",
        },
      });

      expect(response.status).toBe(200);
      expect(getSessionCookie(response)).toContain("session_id=");

      const responseBody = await response.json();
      expect(responseBody.name).toBe("session_user");
      expect(responseBody.email).toBe("session-user@example.com");
    });

    test("should renew the session when the cookie is expired", async () => {
      const firstResponse = await fetch(`${BASE}/api/v1/user`);
      const firstCookie = getSessionCookie(firstResponse);
      const firstSessionId = getSessionIdFromCookie(firstCookie);

      await expireSession(firstSessionId);

      const renewedResponse = await fetch(`${BASE}/api/v1/user`, {
        headers: {
          Cookie: firstCookie,
        },
      });

      expect(renewedResponse.status).toBe(200);

      const renewedCookie = getSessionCookie(renewedResponse);
      const renewedSessionId = getSessionIdFromCookie(renewedCookie);
      expect(renewedSessionId).not.toBe(firstSessionId);

      const renewedBody = await renewedResponse.json();
      expect(renewedBody.name).toBe("session_user");
      expect(renewedBody.email).toBe("session-user@example.com");
      expect(new Date(renewedBody.expires_at).getTime()).toBeGreaterThan(
        Date.now(),
      );
    });
  });
});

describe("session service", () => {
  test("should identify an expired session using fake timers", async () => {
    const sessionModule = await import("models/session.js");
    const sessionService = sessionModule.default;

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));

    const session = {
      expires_at: new Date(
        Date.now() + sessionModule.SESSION_EXPIRATION_IN_MILLISECONDS,
      ),
    };

    expect(sessionService.isExpired(session)).toBe(false);

    jest.setSystemTime(new Date(session.expires_at).getTime() + 1);

    expect(sessionService.isExpired(session)).toBe(true);

    const renewedExpiresAt = sessionService.createExpirationDate();
    expect(renewedExpiresAt.getTime()).toBe(
      Date.now() + sessionModule.SESSION_EXPIRATION_IN_MILLISECONDS,
    );
  });
});
