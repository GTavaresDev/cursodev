import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import authentication from "models/authentication.js";
import authorization from "models/authorization.js";
import session from "models/session.js";
import { UnauthorizedError } from "infra/errors.js";

const router = createRouter();

router.post(
  middlewares.requireBodyFields({
    requiredFields: ["email", "password"],
    allowedFields: ["email", "password"],
  }),
  middlewares.canRequest("create:session"),
  postHandler,
);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser =
    request.authenticatedUser ??
    (await authentication.getAuthenticatedUser(
      userInputValues.email,
      userInputValues.password,
    ));

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new UnauthorizedError({
      message: 'Usuário não possui a feature "create:session".',
      action: "Solicite a liberação desta feature e tente novamente.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}
