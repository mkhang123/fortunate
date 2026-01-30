/*
  Warnings:

  - A unique constraint covering the columns `[txnRef]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "txnRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_txnRef_key" ON "Payment"("txnRef");

-- CreateIndex
CREATE INDEX "Payment_txnRef_idx" ON "Payment"("txnRef");
