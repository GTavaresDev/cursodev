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
      console.log(tryNumber);
      const BASE =
        process.env.TEST_BASE_URL ||
        `http://localhost:${process.env.TEST_PORT || 4000}`;
      const response = await fetch(`${BASE}/api/v1/status`);
      if (!response.ok) {
        throw new Error(
          `Status page not available yet. Status: ${response.status}`,
        );
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

export default waitForAllServices;
