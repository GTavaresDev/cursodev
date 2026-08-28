import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import middlewares from "infra/middlewares.js";
import authorization from "models/authorization.js";
import migrator from "models/migrator.js";

const router = createRouter();

router.get(
  middlewares.injectAnonymousOrUser,
  middlewares.canUserRequest("read:migration"),
  getHandler,
);
router.post(
  middlewares.injectAnonymousOrUser,
  middlewares.canUserRequest("create:migration"),
  postHandler,
);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    request.authenticatedUser,
    "read:migration",
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    request.authenticatedUser,
    "read:migration",
    migratedMigrations,
  );

  if (migratedMigrations.length > 0) {
    return response.status(201).json(secureOutputValues);
  }

  return response.status(200).json(secureOutputValues);
}
