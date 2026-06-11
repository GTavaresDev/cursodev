import { getSessionTokenFromRequest } from "infra/cookies.js";
import { UnauthorizedError } from "infra/erros.js";
import sessionService from "models/session.js";

async function getAuthenticatedUser(req) {
  const token = getSessionTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return sessionService.findValidByToken(token);
}

async function requireAuthenticatedUser(req) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    throw new UnauthorizedError({
      message: "Usuário não autenticado.",
      action: "Faça login para continuar.",
    });
  }

  return user;
}

export { getAuthenticatedUser, requireAuthenticatedUser };
