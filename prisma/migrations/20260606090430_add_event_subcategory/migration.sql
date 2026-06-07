-- CreateEnum
CREATE TYPE "EventSubcategory" AS ENUM ('ONLINE', 'ONSITE', 'EGAMES');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "subcategory" "EventSubcategory";
