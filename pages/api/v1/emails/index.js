import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import authorization from "models/authorization.js";
import email from "models/email.js";

const router = createRouter();

router.post(middlewares.injectAnonymousOrUser, postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const sentEmail = await email.send(request.body);

  const secureOutputValues = authorization.filterOutput(
    request.authenticatedUser,
    "read:email",
    sentEmail,
  );

  return response.status(201).json(secureOutputValues);
}
