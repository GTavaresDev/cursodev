import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.post(controller.users.postUser);

export default router.handler(controller.errorHandlers);
