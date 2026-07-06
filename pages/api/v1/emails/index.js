import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import email from "models/email.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const sentEmail = await email.send(request.body);

  return response.status(201).json(sentEmail);
}
