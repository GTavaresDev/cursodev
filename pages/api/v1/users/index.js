import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import authorization from "models/authorization.js";
import user from "models/user.js";
import activation from "models/activation.js";

const router = createRouter();

router.post(
  middlewares.injectAnonymousOrUser,
  middlewares.requireBodyFields({
    requiredFields: ["username", "email", "password"],
    allowedFields: ["username", "email", "password"],
  }),
  postHandler,
);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);
  await activation.create(newUser);

  const secureOutputValues = authorization.filterOutput(
    request.authenticatedUser,
    "read:user",
    newUser,
  );

  return response.status(201).json(secureOutputValues);
}
