import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import user from "models/user.js";
import activation from "models/activation.js";

const router = createRouter();

router.post(
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
  return response.status(201).json(newUser);
}
