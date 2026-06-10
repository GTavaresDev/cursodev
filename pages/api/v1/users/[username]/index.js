import { requireAuthenticatedUser } from "infra/auth.js";
import userService from "models/user.js";
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "infra/erros.js";

async function patchUserByUsername(req, res, username) {
  const authenticatedUser = await requireAuthenticatedUser(req);
  const normalizedUsername = String(username).toLowerCase();

  if (authenticatedUser.username !== normalizedUsername) {
    throw new ForbiddenError({
      message: "Você não tem permissão para atualizar este usuário.",
      action: "Você só pode atualizar os seus próprios dados de login.",
    });
  }

  const updatedUser = await userService.updateByUsername(username, req.body);

  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(updatedUser);
}

export default async function getUserByUsername(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username } = req.query;

    if (req.method === "PATCH") {
      return await patchUserByUsername(req, res, username);
    }

    const user = await userService.findOneByUsername(username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError
    ) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    console.error("PATCH /api/v1/users/[username] error:", error);
    return res.status(500).json({
      name: "InternalServerError",
      message: "Entre em contato com o suporte para resolver este problema.",
      statusCode: 500,
    });
  }
}
