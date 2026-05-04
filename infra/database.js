import { Client } from "pg";

async function query(queryObject) {
  const isLocalDatabase =
    process.env.POSTGRES_HOST === "localhost" ||
    process.env.POSTGRES_HOST === "127.0.0.1";

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: isLocalDatabase
      ? false
      : {
          rejectUnauthorized: false,
        },
  });

  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    await client.end();
  }
}

const database = {
  query,
};

export default database;
