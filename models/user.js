import database from "infra/database.js";
import crypto from "node:crypto";
import { ValidationError } from "infra/erros.js";

const DEFAULT_SESSION_USER = {
  email: "session-user@example.com",
  username: "session_user",
  password: "session_user_password",
};

class UserService {
  async create({ email, username, password }) {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const client = await database.getNewClient();

    try {
      // Check if email already exists (case-insensitive)
      const existingUser = await client.query(
        `SELECT id FROM users WHERE LOWER(email) = $1`,
        [normalizedEmail],
      );

      if (existingUser.rowCount > 0) {
        throw new ValidationError({
          message: "O email informado a esta sendo ultilizado.",
          action: "Utilize outro email para realizar o cadastro",
        });
      }

      const existingUsername = await client.query(
        `SELECT id FROM users WHERE LOWER(username) = $1`,
        [normalizedUsername],
      );

      if (existingUsername.rowCount > 0) {
        throw new ValidationError({
          message: "O username informado a esta sendo ultilizado.",
          action: "Utilize outro username para realizar o cadastro",
        });
      }

      const id = crypto.randomUUID();
      const result = await client.query(
        `
        INSERT INTO users (id, email, username, password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, username, created_at, updated_at
        `,
        [id, normalizedEmail, username, password],
      );

      return result.rows[0];
    } finally {
      await client.end();
    }
  }

  async findOneByUsername(username) {
    if (!username) return null;
    const normalizedUsername = String(username).toLowerCase();
    const client = await database.getNewClient();
    try {
      const result = await client.query(
        `SELECT id, email, username, created_at, updated_at FROM users WHERE LOWER(username) = $1 LIMIT 1`,
        [normalizedUsername],
      );
      return result.rows[0] || null;
    } finally {
      await client.end();
    }
  }

  async findOneByEmail(email) {
    if (!email) return null;
    const normalizedEmail = String(email).toLowerCase();
    const client = await database.getNewClient();

    try {
      const result = await client.query(
        `SELECT id, email, username, created_at, updated_at FROM users WHERE LOWER(email) = $1 LIMIT 1`,
        [normalizedEmail],
      );
      return result.rows[0] || null;
    } finally {
      await client.end();
    }
  }

  async findOrCreateDefaultSessionUser() {
    const existingUser = await this.findOneByEmail(DEFAULT_SESSION_USER.email);

    if (existingUser) {
      return existingUser;
    }

    try {
      return await this.create(DEFAULT_SESSION_USER);
    } catch (err) {
      if (err instanceof ValidationError) {
        return this.findOneByEmail(DEFAULT_SESSION_USER.email);
      }

      throw err;
    }
  }

  async findByUsername(username) {
    const client = await database.getNewClient();
    try {
      const result = await client.query(
        `SELECT id, email, username, created_at, updated_at FROM users WHERE username = $1 LIMIT 1`,
        [username],
      );
      return result.rows[0] || null;
    } finally {
      await client.end();
    }
  }
}

export default new UserService();
