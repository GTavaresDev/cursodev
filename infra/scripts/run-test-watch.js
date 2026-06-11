const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

const DEFAULT_PORTS = [Number(process.env.TEST_PORT || 4000)];

dotenvExpand.expand(dotenv.config({ path: ".env.development" }));

function buildTestEnv() {
  const testDatabaseName = getTestDatabaseName();
  const testDatabaseUrl = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${testDatabaseName}`;

  return {
    ...process.env,
    POSTGRES_DB: testDatabaseName,
    DATABASE_URL: testDatabaseUrl,
    TEST_PORT: String(process.env.TEST_PORT || 4000),
  };
}

function getTestDatabaseName() {
  if (process.env.POSTGRES_TEST_DB) {
    return process.env.POSTGRES_TEST_DB;
  }

  if (process.env.POSTGRES_DB.endsWith("_test")) {
    return process.env.POSTGRES_DB;
  }

  return `${process.env.POSTGRES_DB}_test`;
}

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

async function isDefaultDevServerRunning() {
  return await isServerReady("http://localhost:3000");
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
  const isCi = process.argv.includes("--ci");
  const testEnv = buildTestEnv();
  const testCommand = isCi ? "jest --runInBand" : "jest --watchAll --runInBand";

  execSync("npm run services:up", { stdio: "inherit" });
  execSync("npm run wait-for-postgres", { stdio: "inherit" });
  execSync("node infra/scripts/prepare-test-database.js", {
    stdio: "inherit",
    env: testEnv,
  });
  execSync("node-pg-migrate -m infra/migrations up", {
    stdio: "inherit",
    env: testEnv,
  });

  const runningServer = await findRunningTestServer();

  if (runningServer) {
    console.log(
      `Servidor já disponível em ${runningServer}. Iniciando testes...`,
    );

    await runCommand(
      "jest",
      isCi ? ["--runInBand"] : ["--watchAll", "--runInBand"],
      {
        ...testEnv,
        TEST_BASE_URL: runningServer,
      },
    );
    return;
  }

  if (await isDefaultDevServerRunning()) {
    throw new Error(
      "Servidor dev ativo em http://localhost:3000. Pare esse servidor antes de rodar testes para evitar compartilhar o banco de desenvolvimento.",
    );
  }

  removeStaleDevLock();

  const testPort = Number(process.env.TEST_PORT || 4000);
  const baseUrl = `http://localhost:${testPort}`;

  await runCommand(
    "start-server-and-test",
    [`"PORT=${testPort} next dev"`, baseUrl, `"${testCommand}"`],
    {
      ...testEnv,
      TEST_BASE_URL: baseUrl,
    },
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
