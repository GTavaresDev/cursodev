const retry = require("async-retry");

async function waitForAllServices() {
  return retry(fetchStatusPage, {
    retries: 100,
    maxTimeout: 1000,
  });

  async function fetchStatusPage() {
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

async function runPendingMigrations() {
  // Lazy load migrator to avoid ESM import issues during test setup
  const migrator = (await import("../models/migrator.js")).default;
  await migrator.runMigrations();
}

const orchestrator = {
  waitForAllServices,
  runPendingMigrations,
};

module.exports = orchestrator;
