import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;
  const activationToken = await activation.findOneValidById(activationTokenId);
  const activatedUser = await activation.activateUserByUserId(
    activationToken.user_id,
  );

  await activation.markTokenAsUsed(activationToken.id);
  await activation.sendActivatedEmail(activatedUser);

  return response.status(200).json(activatedUser);
}
