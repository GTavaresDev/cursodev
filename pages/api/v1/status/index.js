import database from "infra/database.js";
import { InternalServerError } from "infra/erros.js";

async function GetStatus(req, res) {
  const updateAt = new Date().toISOString();

  const dbClient = await database.getNewClient();

  try {
    const databaseVersion = await dbClient.query("SHOW server_version;");
    const databaseVersionString = databaseVersion.rows[0].server_version;

    const databaseMaxConnections = await dbClient.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnections.rows[0].max_connections;

    const currentDatabaseResult = await dbClient.query(
      "SELECT current_database();",
    );
    const databaseName = currentDatabaseResult.rows[0].current_database;

    const databaseOpenedConnectionsResult = await dbClient.query({
      text: "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });

    const databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].count;

    res.status(200).json({
      updated_at: updateAt,
      dependencies: {
        database: {
          version: databaseVersionString,
          max_connections: parseInt(databaseMaxConnectionsValue),
          opened_connections: parseInt(databaseOpenedConnectionsValue),
        },
      },
    });
  } catch (err) {
    console.error("GetStatus error:", err);
    const publicErrorMessage = new InternalServerError({
      cause: err,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: publicErrorMessage });
    }
  } finally {
    await dbClient.end();
  }
}

export default GetStatus;
