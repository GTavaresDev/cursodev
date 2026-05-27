import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
} from "infra/erros.js";
import migrator from "models/migrator.js";
import userService from "models/user.js";

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

async function postUser(req, res) {
  try {
    const { email, username, password } = req.body;
    const user = await userService.create({ email, username, password });
    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(err.toJSON());
      return res.status(err.statusCode).json(err);
    }
    throw err;
  }
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
  users: {
    postUser,
  },
};
export default controller;
