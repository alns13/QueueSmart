import app from "./app.js";
import env from "./config/env.js";
import { ensureSeedUsers } from "./modules/auth/auth.service.js";

async function start() {
  await ensureSeedUsers();

  app.listen(env.port, () => {
    console.log(`Backend is running at http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
