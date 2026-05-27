import { runner as migrationRunner } from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

class Migrator {
  async getPendingMigrations() {
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

      return pendingMigrations;
    } finally {
      await dbClient.end();
    }
  }

  async runMigrations() {
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

      return createdMigrations;
    } finally {
      await dbClient.end();
    }
  }
}

export default new Migrator();
