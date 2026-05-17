import retry from "async-retry";
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

export default waitForAllServices;
