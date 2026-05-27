require("dotenv").config({ path: ".env.development" });
const { Client } = require("pg");
const fetch = global.fetch || require("node-fetch");

(async () => {
  const postgresConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || "local_user",
    password: String(process.env.POSTGRES_PASSWORD || "local_password"),
    database: process.env.POSTGRES_DB || "local_db",
    ssl: false,
  };

  const client = new Client(postgresConfig);
  await client.connect();
  try {
    const res = await client.query(
      `INSERT INTO users (email, username, password, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id, username`,
      ["tmpfetch@example.com", "tmpfetchuser", "pwd"],
    );
    const id = res.rows[0].id;
    console.log("Inserted id", id);
  } catch (e) {
    console.error("db insert error", e.stack || e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }

  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;
  try {
    // Also run SELECT queries directly to verify DB access
    const client2 = new (require("pg").Client)(postgresConfig);
    await client2.connect();
    try {
      const q1 = await client2.query(
        `SELECT id, email, username FROM users WHERE username = $1 LIMIT 1`,
        ["tmpfetchuser"],
      );
      console.log("select by username result:", q1.rows[0]);

      const q2 = await client2.query(
        `SELECT id, email, username FROM users WHERE LOWER(username) = $1 LIMIT 1`,
        ["tmpfetchuser"],
      );
      console.log("select by lower(username) result:", q2.rows[0]);
    } finally {
      await client2.end();
    }

    const r = await fetch(`${BASE}/api/v1/users/tmpfetchuser`);
    const text = await r.text();
    console.log("GET status", r.status, "body:", text);
  } catch (e) {
    console.error("fetch error", e.stack || e.message || e);
  }
})();
