const { Client } = require("pg");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

dotenvExpand.expand(dotenv.config({ path: ".env.development" }));

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

async function main() {
  const testDatabaseName = getTestDatabaseName();

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
    ssl: false,
  });

  await client.connect();

  try {
    const existingDatabase = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [testDatabaseName],
    );

    if (existingDatabase.rowCount === 0) {
      await client.query(
        `CREATE DATABASE ${quoteIdentifier(testDatabaseName)}`,
      );
      console.log(`Banco de testes criado: ${testDatabaseName}`);
      return;
    }

    console.log(`Banco de testes pronto: ${testDatabaseName}`);
  } finally {
    await client.end();
  }
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
