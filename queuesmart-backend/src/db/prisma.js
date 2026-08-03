import { PrismaClient } from "@prisma/client";

if (process.env.NODE_TEST_CONTEXT && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./test.db";
}

const prisma = new PrismaClient();

export default prisma;
