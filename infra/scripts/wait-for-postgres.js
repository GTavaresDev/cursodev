const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const { createConnection } = require("net");
const { Client } = require("pg");

dotenvExpand.expand(dotenv.config({ path: ".env.development" }));

const CHECK_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = Number(process.env.WAIT_FOR_POSTGRES_MAX_ATTEMPTS) || 60;
const POSTGRES_HOST = process.env.POSTGRES_HOST || "localhost";
const POSTGRES_PORT = Number(process.env.POSTGRES_PORT || 5432);

let attempts = 0;

function checkPostgres() {
  attempts += 1;

  // Try via pg client first
  const client = new Client({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "postgres",
    ssl: false,
    statement_timeout: 5000,
  });

  client
    .connect()
    .then(() => {
      console.log(`🟢 Postgres is ready at ${POSTGRES_HOST}:${POSTGRES_PORT}`);
      client.end();
      process.exit(0);
    })
    .catch((err) => {
      client.end();

      if (attempts >= MAX_ATTEMPTS) {
        console.error(
          `🔴 Postgres did not become ready within timeout at ${POSTGRES_HOST}:${POSTGRES_PORT}`,
        );
        console.error(err.message);
        process.exit(1);
        return;
      }

      // still not ready — log status and schedule next check
      console.log(
        `🔴 Attempt ${attempts}/${MAX_ATTEMPTS}: Postgres not ready yet (${err.message})`,
      );
      setTimeout(checkPostgres, CHECK_INTERVAL_MS);
    });
}

console.log(
  `⏳ Aguardando o Postgres iniciar em ${POSTGRES_HOST}:${POSTGRES_PORT}...`,
);
checkPostgres();
