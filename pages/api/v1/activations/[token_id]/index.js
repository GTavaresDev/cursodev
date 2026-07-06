import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import { ForbiddenError } from "infra/errors.js";
import activation from "models/activation.js";

const router = createRouter();

router.patch(
  middlewares.injectAnonymousOrUser,
  middlewares.canActivationTokenRequest(),
  patchHandler,
);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;
  const activationToken = await activation.findOneValidById(activationTokenId);

  if (
    !request.isAnonymous &&
    request.authenticatedUser.id !== activationToken.user_id
  ) {
    throw new ForbiddenError({
      message: "Você não pode ativar a conta de outro usuário.",
      action:
        "Utilize o link de ativação enviado para o seu email ou faça logout e tente novamente.",
    });
  }

  const activatedUser = await activation.activateUserByUserId(
    activationToken.user_id,
  );

  await activation.markTokenAsUsed(activationToken.id);
  await activation.sendActivatedEmail(activatedUser);

  return response.status(200).json(activatedUser);
}
