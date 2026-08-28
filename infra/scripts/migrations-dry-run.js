const dotenv = require("dotenv");
const { execSync } = require("node:child_process");

dotenv.config({ path: ".env.development" });

console.log("\n🔍 Verificando migrations pendentes (dry-run)...\n");
console.log(`   Banco: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}\n`);

try {
  execSync(
    "node-pg-migrate -m infra/migrations --envPath .env.development up --dry-run",
    { stdio: "inherit" },
  );
} catch (error) {
  process.exit(error.status ?? 1);
}
