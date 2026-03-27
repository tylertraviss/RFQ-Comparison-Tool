-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('WAITING', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT,
    "supplierName" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "unitSell" DOUBLE PRECISION NOT NULL,
    "unitProfit" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "leadTimeDays" INTEGER,
    "markup" DOUBLE PRECISION NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'WAITING',
    "lostBy" DOUBLE PRECISION,
    "bidDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);
