import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.get(controller.user.getUser);

export default router.handler(controller.errorHandlers);
