-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "status" "BidStatus" NOT NULL DEFAULT 'PENDING';
