import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.post(controller.users.postUser);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const { email, username, password } = req.body;
  const user = await userService.create({ email, username, password });
  return res.status(201).json(user);
}
