import retry from "async-retry";
async function waitForAllServices() {
  await waitForWebServer();
  async function waitForWebServer() {
    return retry(fetchStatusPage);

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (!response.ok) {
        throw new Error(
          `Status page not available yet. Status: ${response.status}`,
        );
      }
    }
  }
}

export default waitForAllServices;
