import database from "infra/database.js";
import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "session_id";
export const SESSION_EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

class SessionService {
  createExpirationDate() {
    return new Date(Date.now() + SESSION_EXPIRATION_IN_MILLISECONDS);
  }

  isExpired(session) {
    if (!session?.expires_at) return true;
    return new Date(session.expires_at).getTime() <= Date.now();
  }

  async createForUser(userId) {
    const client = await database.getNewClient();
    const sessionId = crypto.randomUUID();
    const expiresAt = this.createExpirationDate();

    try {
      const result = await client.query(
        `
        INSERT INTO sessions (id, user_id, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, user_id, expires_at, created_at, updated_at
        `,
        [sessionId, userId, expiresAt],
      );

      return result.rows[0];
    } finally {
      await client.end();
    }
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

  async renew(session) {
    return this.createForUser(session.user_id);
  }
}

export default new SessionService();
