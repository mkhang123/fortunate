import "dotenv/config";
import prisma from "../src/config/prisma.js";

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("DB_OK");
} catch (e) {
  console.error("DB_FAIL", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
