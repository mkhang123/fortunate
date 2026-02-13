-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('RECTANGLE', 'TRIANGLE', 'INVERTED_TRIANGLE', 'HOURGLASS', 'OVAL');

-- AlterTable
ALTER TABLE "UserBodyProfile" ADD COLUMN     "bodyType" "BodyType";
