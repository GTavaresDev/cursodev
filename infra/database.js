import { Client } from "pg";

async function query(queryObject) {
  const hasConnectionString = Boolean(process.env.DATABASE_URL);
  const databaseHost = process.env.POSTGRES_HOST;
  const isLocalDatabase =
    databaseHost === "localhost" || databaseHost === "127.0.0.1";

  if (
    process.env.NODE_ENV === "production" &&
    !hasConnectionString &&
    isLocalDatabase
  ) {
    throw new Error(
      "Invalid production database configuration: POSTGRES_HOST points to localhost. Configure the Vercel environment with your remote Supabase Postgres credentials or DATABASE_URL.",
    );
  }

  const client = hasConnectionString
    ? new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      })
    : new Client({
        host: databaseHost,
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
