-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
