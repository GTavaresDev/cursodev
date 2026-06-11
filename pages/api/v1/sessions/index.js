import {
  clearSessionCookie,
  getSessionTokenFromRequest,
  setSessionCookie,
} from "infra/cookies.js";
import { UnauthorizedError, ValidationError } from "infra/erros.js";
import { getAuthenticatedUser } from "infra/auth.js";
import sessionService from "models/session.js";
import userService from "models/user.js";

async function createSession(req, res) {
  const { email, password } = req.body;
  const user = await userService.authenticate({ email, password });
  const session = await sessionService.create(user.id);

  setSessionCookie(res, session.token);

  return res.status(201).json(user);
}

async function getCurrentSession(req, res) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    throw new UnauthorizedError({
      message: "Usuário não autenticado.",
      action: "Faça login para continuar.",
    });
  }

  return res.status(200).json(user);
}

async function deleteSession(req, res) {
  const token = getSessionTokenFromRequest(req);

  if (token) {
    await sessionService.invalidateByToken(token);
  }

  clearSessionCookie(res);

  return res.status(200).json({ message: "Sessão encerrada com sucesso." });
}

export default async function sessions(req, res) {
  if (
    req.method !== "POST" &&
    req.method !== "GET" &&
    req.method !== "DELETE"
  ) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (req.method === "POST") {
      return await createSession(req, res);
    }

    if (req.method === "GET") {
      return await getCurrentSession(req, res);
    }

    return await deleteSession(req, res);
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError
    ) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    console.error(`${req.method} /api/v1/sessions error:`, error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
