const { exec } = require("node:child_process");

const CHECK_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = Number(process.env.WAIT_FOR_POSTGRES_MAX_ATTEMPTS) || 60;

let attempts = 0;

function checkPostgres() {
  attempts += 1;
  exec(
    "docker compose -f infra/compose.yaml exec -T database pg_isready",
    (error, stdout, stderr) => {
      if (!error) {
        console.log("🟢 Postgres is ready:", stdout.trim());
        process.exit(0);
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        console.error("🔴 Postgres did not become ready within timeout.");
        if (stderr) console.error(stderr.toString());
        process.exit(1);
        return;
      }

      // still not ready — log status and schedule next check
      console.log(
        `🔴 Attempt ${attempts}/${MAX_ATTEMPTS}: Postgres not ready yet`,
      );
      setTimeout(checkPostgres, CHECK_INTERVAL_MS);
    },
  );
}

console.log("⏳ Aguardando o Postgres iniciar...");
checkPostgres();
