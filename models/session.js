import database from "infra/database.js";
import { SESSION_MAX_AGE_SECONDS } from "infra/cookies.js";
import crypto from "node:crypto";

class SessionService {
  async create(userId) {
    const token = crypto.randomUUID();
    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `
        INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::interval, NOW(), NOW())
        RETURNING id, user_id, token, expires_at, created_at, updated_at
        `,
        [crypto.randomUUID(), userId, token, SESSION_MAX_AGE_SECONDS],
      );

      return result.rows[0];
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
