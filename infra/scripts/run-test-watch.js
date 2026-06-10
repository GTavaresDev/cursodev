const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_PORTS = [
  Number(process.env.TEST_PORT || 4000),
  3000,
];

async function isServerReady(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/v1/status`);
    return response.ok;
  } catch {
    return false;
  }
}

async function findRunningTestServer() {
  for (const port of DEFAULT_PORTS) {
    const baseUrl = `http://localhost:${port}`;

    if (await isServerReady(baseUrl)) {
      return baseUrl;
    }
  }

  return null;
}

function removeStaleDevLock() {
  const lockPath = path.join(process.cwd(), ".next/dev/lock");

  if (!fs.existsSync(lockPath)) {
    return;
  }

  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    process.kill(lock.pid, 0);
  } catch {
    fs.unlinkSync(lockPath);
  }
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      env,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command}`));
    });
  });
}

async function main() {
  execSync("npm run services:up", { stdio: "inherit" });
  execSync("npm run wait-for-postgres", { stdio: "inherit" });
  execSync("npm run migration:up", { stdio: "inherit" });

  const runningServer = await findRunningTestServer();

  if (runningServer) {
    console.log(
      `Servidor já disponível em ${runningServer}. Iniciando Jest em modo watch...`,
    );

    await runCommand("jest", ["--watchAll", "--runInBand"], {
      ...process.env,
      TEST_BASE_URL: runningServer,
    });
    return;
  }

  removeStaleDevLock();

  const testPort = Number(process.env.TEST_PORT || 4000);
  const baseUrl = `http://localhost:${testPort}`;

  await runCommand("start-server-and-test", [
    `"PORT=${testPort} next dev"`,
    baseUrl,
    '"jest --watchAll --runInBand"',
  ], {
    ...process.env,
    TEST_BASE_URL: baseUrl,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
