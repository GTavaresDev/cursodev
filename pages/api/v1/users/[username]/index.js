import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.get(controller.users.getUserByUsername);

export default router.handler(controller.errorHandlers);
