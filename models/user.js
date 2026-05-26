import database from "infra/database.js";
import crypto from "node:crypto";

class UserService {
  async create({ email, username, password }) {
    const id = crypto.randomUUID();
    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `
        INSERT INTO users (id, email, username, password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, username, created_at, updated_at
        `,
        [id, email, username, password],
      );

      return result.rows[0];
    } finally {
      await client.end();
    }
  }
}

export default new UserService();
