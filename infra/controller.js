import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
} from "infra/erros.js";
import migrator from "models/migrator.js";
import {
  getSessionTokenFromRequest,
  setSessionCookie,
} from "infra/cookies.js";
import sessionService from "models/session.js";
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
  console.error("onErrorHandler publicErrorMessage:", publicErrorMessage);
  console.error("onErrorHandler original error:", err);
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

async function runMigrationsWithOk(req, res) {
  const createdMigrations = await migrator.runMigrations();
  return res.status(200).json(createdMigrations);
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

async function getUserByUsername(req, res) {
  try {
    const { username } = req.query;
    const user = await userService.findOneByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error("getUserByUsername error:", err);
    throw err;
  }
}

function mapSessionToResponse(session) {
  return {
    id: session.user_id,
    name: session.username,
    email: session.email,
    expires_at: new Date(session.expires_at).toISOString(),
  };
}

async function getUser(req, res) {
  const sessionToken = getSessionTokenFromRequest(req);
  const session = await sessionService.findByTokenWithUser(sessionToken);

  if (session && !sessionService.isExpired(session)) {
    return res.status(200).json(mapSessionToResponse(session));
  }

  if (session && sessionService.isExpired(session)) {
    const renewedSession = await sessionService.renew(session);
    const renewedSessionWithUser = await sessionService.findByIdWithUser(
      renewedSession.id,
    );

    setSessionCookie(res, renewedSession.token);
    return res.status(200).json(mapSessionToResponse(renewedSessionWithUser));
  }

  const user = await userService.findOrCreateDefaultSessionUser();
  const newSession = await sessionService.createForUser(user.id);

  setSessionCookie(res, newSession.token);
  return res.status(200).json({
    id: user.id,
    name: user.username,
    email: user.email,
    expires_at: new Date(newSession.expires_at).toISOString(),
  });
}

const controller = {
  errorHandlers: {
    onNoMatch: OnNoMatchHandler,
    onError: onErrorHandler,
  },
  migrations: {
    getPendingMigrations,
    runMigrations,
    runMigrationsWithOk,
  },
  users: {
    postUser,
    getUserByUsername,
  },
  user: {
    getUser,
  },
};
export default controller;
