const orchestrator = require("tests/orchestrator.js");

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("Get to /api/v1/status should return 200", async () => {
  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;
  const response = await fetch(`${BASE}/api/v1/status`);
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  expect(responseBody.updated_at).toBeDefined();

  const parsedUpdateAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.updated_at).toEqual(parsedUpdateAt);

  expect(responseBody.dependencies.database.version).toEqual("16.0");
  expect(responseBody.dependencies.database.max_connections).toEqual(100);
  expect(responseBody.dependencies.database.opened_connections).toEqual(1);
});
