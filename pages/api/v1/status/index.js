import database from "infra/database.js";

async function GetStatus(req, res) {
  const updateAt = new Date().toISOString();

  const databaseVersion = await database.query("SHOW server_version;");
  const databaseVersionString = databaseVersion.rows[0].server_version;

  const databaseMaxConnections = await database.query("SHOW max_connections;");
  const databaseMaxConnectionsValue =
    databaseMaxConnections.rows[0].max_connections;

  const currentDatabaseResult = await database.query(
    "SELECT current_database();",
  );
  const databaseName = currentDatabaseResult.rows[0].current_database;

  const databaseOpenedConnectionsResult = await database.query({
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
}

export default GetStatus;
