import migrationRuner from "node-pg-migrate";
import { join } from "node:path";

function getDatabaseConfig() {
  return {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || "local_user",
    password: String(process.env.POSTGRES_PASSWORD || "local_password"),
    database: process.env.POSTGRES_DB || "local_db",
    ssl: false,
  };
}

export default async function migrations(req, res) {
  if (req.method === "GET") {
    const migrations = await migrationRuner({
      databaseUrl: getDatabaseConfig(),
      dryRun: true,
      noLock: true,
      dir: join(process.cwd(), "infra/migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    });

    return res.status(200).json(migrations);
  }

  if (req.method === "POST") {
    const migrations = await migrationRuner({
      databaseUrl: getDatabaseConfig(),
      dryRun: false,
      noLock: true,
      dir: join(process.cwd(), "infra/migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    });

    return res.status(200).json(migrations);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
