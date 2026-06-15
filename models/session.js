import database from "infra/database.js";
import { SESSION_MAX_AGE_SECONDS } from "infra/cookies.js";
import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "session_id";
export const SESSION_EXPIRATION_IN_MILLISECONDS =
  SESSION_MAX_AGE_SECONDS * 1000;

class SessionService {
  createExpirationDate() {
    return new Date(Date.now() + SESSION_EXPIRATION_IN_MILLISECONDS);
  }

  isExpired(session) {
    if (!session?.expires_at) return true;
    return new Date(session.expires_at).getTime() <= Date.now();
  }

  async create(userId) {
    const client = await database.getNewClient();
    const sessionId = crypto.randomUUID();
    const token = crypto.randomUUID();

    try {
      const result = await client.query(
        `
        INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::interval, NOW(), NOW())
        RETURNING id, user_id, token, expires_at, created_at, updated_at
        `,
        [sessionId, userId, token, SESSION_MAX_AGE_SECONDS],
      );

      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  async createForUser(userId) {
    return this.create(userId);
  }

  async findByIdWithUser(sessionId) {
    if (!sessionId) return null;

    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `
        SELECT
          sessions.id,
          sessions.user_id,
          sessions.token,
          sessions.expires_at,
          users.email,
          users.username
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.id = $1
        LIMIT 1
        `,
        [sessionId],
      );

      return result.rows[0] || null;
    } finally {
      await client.end();
    }
  }

  async findValidByToken(token) {
    if (!token) {
      return null;
    }

    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `
        SELECT
          users.id,
          users.email,
          users.username,
          users.created_at,
          users.updated_at
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = $1
          AND sessions.expires_at > NOW()
        LIMIT 1
        `,
        [token],
      );

      return result.rows[0] || null;
    } finally {
      await client.end();
    }
  }

  async findByTokenWithUser(token) {
    if (!token) return null;

    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `
        SELECT
          sessions.id,
          sessions.user_id,
          sessions.token,
          sessions.expires_at,
          users.email,
          users.username
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = $1
        LIMIT 1
        `,
        [token],
      );

      return result.rows[0] || null;
    } finally {
      await client.end();
    }
  }

  async renew(session) {
    return this.create(session.user_id);
  }

  async invalidateByToken(token) {
    if (!token) {
      return false;
    }

    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `DELETE FROM sessions WHERE token = $1`,
        [token],
      );

      return result.rowCount > 0;
    } finally {
      await client.end();
    }
  }
}

export default new SessionService();
