import bcrypt from "bcrypt";
import prisma from "../src/config/prisma.js";

async function main() {
  const email = "fortunate@admin.com";
  const plainPassword = "fortunate@admin123";

  // Kiểm tra nếu admin đã tồn tại thì bỏ qua
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin đã tồn tại: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
}

main()
  .catch((e) => {
    console.error("Seed thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
