import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const prismaDirectory = join(backendRoot, "prisma");
const databasePath = join(prismaDirectory, "test.db");

if (existsSync(databasePath)) rmSync(databasePath);
const database = new DatabaseSync(databasePath);
for (const directory of readdirSync(join(prismaDirectory, "migrations")).sort()) {
  if (directory === "migration_lock.toml") continue;
  database.exec(readFileSync(join(prismaDirectory, "migrations", directory, "migration.sql"), "utf8"));
}
database.close();
console.log("Isolated SQLite test database initialized.");
