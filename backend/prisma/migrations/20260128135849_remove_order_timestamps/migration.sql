/*
  Warnings:

  - You are about to drop the column `cancelledAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippedAt` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "cancelledAt",
DROP COLUMN "completedAt",
DROP COLUMN "shippedAt";
