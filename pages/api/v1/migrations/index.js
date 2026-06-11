import { createRouter } from "next-connect";
import controller from "infra/controller.js";

const router = createRouter();

router.get(controller.migrations.runMigrationsWithOk);
router.post(controller.migrations.runMigrations);

export default router.handler(controller.errorHandlers);
