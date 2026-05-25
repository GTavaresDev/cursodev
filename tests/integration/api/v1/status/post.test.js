import waitForAllServices from "../../../../orchestrator";

beforeAll(async () => {
  await waitForAllServices();
});

test("Post to /api/v1/status should return 405", async () => {
  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;
  const response = await fetch(`${BASE}/api/v1/status`, {
    method: "POST",
  });
  expect(response.status).toBe(405);

  const responseBody = await response.json();
  expect(responseBody).toEqual({
    name: "MethodNotAllowedError",
    message: "Method Not Allowed",
    action: "Verifique se o método está correto.",
    statusCode: 405,
  });
});
