import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);
router.patch(middlewares.requireSession, patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const authenticatedUser = await user.findOneById(request.session.user_id);
  const userFound = await user.findOneByUsername(username);

  if (!authorization.can(authenticatedUser, "update:user")) {
    throw new ForbiddenError({
      message: 'Usuário não possui a feature "update:user".',
      action: "Solicite a liberação desta feature e tente novamente.",
    });
  }

  if (!authorization.can(authenticatedUser, "update:user", userFound)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action: "Verifique se você possui permissão para realizar esta operação.",
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  return response.status(200).json(updatedUser);
}
