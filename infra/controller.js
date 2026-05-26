import { InternalServerError, MethodNotAllowedError } from "infra/erros.js";
import migrator from "models/migrator.js";

function OnNoMatchHandler(req, res) {
  const publicErrorMessage = new MethodNotAllowedError();
  return res.status(publicErrorMessage.statusCode).json(publicErrorMessage);
}

function onErrorHandler(err, req, res) {
  const publicErrorMessage = new InternalServerError({
    cause: err,
    statusCode: err.statusCode ?? undefined,
  });
  console.error(publicErrorMessage);
  return res.status(publicErrorMessage.statusCode).json(publicErrorMessage);
}

async function getPendingMigrations(req, res) {
  const pendingMigrations = await migrator.getPendingMigrations();
  return res.status(200).json(pendingMigrations);
}

async function runMigrations(req, res) {
  const createdMigrations = await migrator.runMigrations();

  if (!createdMigrations || createdMigrations.length === 0) {
    return res.status(200).json(createdMigrations);
  }

  return res.status(201).json(createdMigrations);
}

const controller = {
  errorHandlers: {
    onNoMatch: OnNoMatchHandler,
    onError: onErrorHandler,
  },
  migrations: {
    getPendingMigrations,
    runMigrations,
  },
};
export default controller;
