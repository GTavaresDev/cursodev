import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import session from "models/session";

const router = createRouter();

router.get(
  middlewares.requireSession,
  middlewares.canSessionRequest("activation"),
  middlewares.canSessionRequest("read:session"),
  getHandler,
);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const renewedSessionObject = await session.renew(request.session.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  return response.status(200).json(request.authenticatedUser);
}
