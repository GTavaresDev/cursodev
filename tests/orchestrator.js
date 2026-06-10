import retry from "async-retry";
import { faker } from "@faker-js/faker";
async function waitForAllServices() {
  await waitForWebServer();
  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage(bail, tryNumber) {
      const BASE =
        process.env.TEST_BASE_URL ||
        `http://localhost:${process.env.TEST_PORT || 4000}`;

      try {
        const response = await fetch(`${BASE}/api/v1/status`);

        if (!response.ok) {
          throw new Error(
            `Status page not available yet. Status: ${response.status}`,
          );
        }
      } catch (error) {
        if (tryNumber >= 100) {
          bail(
            new Error(
              `Servidor de testes indisponível em ${BASE}/api/v1/status. Inicie com "PORT=4000 next dev" ou use "npm run test".`,
            ),
          );
          return;
        }

        throw error;
      }
    }
  }
}

waitForAllServices.createUser = async function createUser(userData) {
  const generatedUserData = {
    email: faker.internet.email().toLowerCase(),
    username: faker.internet.username().toLowerCase(),
    password: faker.internet.password({ length: 12 }),
  };

  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;

  const response = await fetch(`${BASE}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...generatedUserData,
      ...userData,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user. Status: ${response.status}`);
  }

  return response.json();
};

waitForAllServices.createSession = async function createSession({
  email,
  password,
}) {
  const BASE =
    process.env.TEST_BASE_URL ||
    `http://localhost:${process.env.TEST_PORT || 4000}`;

  const response = await fetch(`${BASE}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session. Status: ${response.status}`);
  }

  const setCookieHeader = response.headers.get("set-cookie");
  const sessionCookie = setCookieHeader?.split(";")[0] || null;

  return {
    user: await response.json(),
    sessionCookie,
  };
};

export default waitForAllServices;
