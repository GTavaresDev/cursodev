import { runner as migrationRunner } from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

export default async function migrations(req, res) {
  if (req.method === "GET") {
    const dbClient = await database.getNewClient();

    try {
      const pendingMigrations = await migrationRunner({
        dbClient,
        dryRun: true,
        noLock: true,
        dir: join(process.cwd(), "infra/migrations"),
        direction: "up",
        verbose: true,
        migrationsTable: "pgmigrations",
      });

      return res.status(200).json(pendingMigrations);
    } finally {
      await dbClient.end();
    }
  }

  if (req.method === "POST") {
    const dbClient = await database.getNewClient();

    try {
      const createdMigrations = await migrationRunner({
        dbClient,
        dryRun: false,
        noLock: true,
        dir: join(process.cwd(), "infra/migrations"),
        direction: "up",
        verbose: true,
        migrationsTable: "pgmigrations",
      });

      if (!createdMigrations || createdMigrations.length === 0) {
        return res.status(200).json(createdMigrations);
      }
      return res.status(201).json(createdMigrations);
    } finally {
      await dbClient.end();
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
