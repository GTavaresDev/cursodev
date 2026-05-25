import { createRouter } from "next-connect";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/erros.js";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: OnNoMatchHandler,
  onError: onErrorHandler,
});

function OnNoMatchHandler(req, res) {
  const publicErrorMessage = new MethodNotAllowedError();
  return res.status(publicErrorMessage.statusCode).json(publicErrorMessage);
}

function onErrorHandler(err, req, res) {
  const publicErrorMessage = new InternalServerError({ cause: err });
  console.error(publicErrorMessage);
  return res.status(publicErrorMessage.statusCode).json(publicErrorMessage);
}
async function getHandler(req, res) {
  const updateAt = new Date().toISOString();

  const dbClient = await database.getNewClient();

  return (async () => {
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
  })().finally(() => dbClient.end());
}
