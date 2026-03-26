import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing bids
  await prisma.bid.deleteMany()

  await prisma.bid.createMany({
    data: [
      // WON
      {
        partNumber: 'MS21042-3',
        description: 'Nut, Self-Locking',
        supplierName: 'Apex Defense Supply',
        unitCost: 0.78,
        unitSell: 0.92,
        unitProfit: 0.14,
        quantity: 500,
        leadTimeDays: 14,
        markup: 18,
        status: 'WON',
        bidDate: new Date('2026-03-04'),
      },
      {
        partNumber: 'AN3-5A',
        description: 'Bolt, Machine',
        supplierName: 'Ironclad Fastener Co.',
        unitCost: 2.10,
        unitSell: 2.52,
        unitProfit: 0.42,
        quantity: 150,
        leadTimeDays: 21,
        markup: 20,
        status: 'WON',
        bidDate: new Date('2026-03-08'),
      },
      {
        partNumber: 'NAS1149C0363R',
        description: 'Washer, Flat',
        supplierName: 'Patriot Hardware Solutions',
        unitCost: 0.29,
        unitSell: 0.34,
        unitProfit: 0.05,
        quantity: 500,
        leadTimeDays: 18,
        markup: 17,
        status: 'WON',
        bidDate: new Date('2026-03-12'),
      },
      {
        partNumber: 'MS35206-242',
        description: 'Screw, Machine',
        supplierName: 'Apex Defense Supply',
        unitCost: 1.15,
        unitSell: 1.38,
        unitProfit: 0.23,
        quantity: 200,
        leadTimeDays: 25,
        markup: 20,
        status: 'WON',
        bidDate: new Date('2026-03-18'),
      },

      // WAITING
      {
        partNumber: 'AN960-10',
        description: 'Washer, Plain',
        supplierName: 'Ironclad Fastener Co.',
        unitCost: 0.15,
        unitSell: 0.18,
        unitProfit: 0.03,
        quantity: 300,
        leadTimeDays: 12,
        markup: 18,
        status: 'WAITING',
        bidDate: new Date('2026-03-21'),
      },
      {
        partNumber: 'MS21042-4',
        description: 'Nut, Self-Locking, #8',
        supplierName: 'Patriot Hardware Solutions',
        unitCost: 0.91,
        unitSell: 1.08,
        unitProfit: 0.17,
        quantity: 400,
        leadTimeDays: 20,
        markup: 18,
        status: 'WAITING',
        bidDate: new Date('2026-03-24'),
      },

      // LOST
      {
        partNumber: 'AN960-416L',
        description: 'Washer, Plain, Light',
        supplierName: 'Apex Defense Supply',
        unitCost: 0.22,
        unitSell: 0.26,
        unitProfit: 0.04,
        quantity: 600,
        leadTimeDays: 16,
        markup: 18,
        status: 'LOST',
        lostBy: 0.03,
        bidDate: new Date('2026-02-28'),
      },
      {
        partNumber: 'NAS1149D0432J',
        description: 'Washer, Flat, Steel',
        supplierName: 'Ironclad Fastener Co.',
        unitCost: 0.44,
        unitSell: 0.52,
        unitProfit: 0.08,
        quantity: 250,
        leadTimeDays: 22,
        markup: 18,
        status: 'LOST',
        lostBy: 0.07,
        bidDate: new Date('2026-03-02'),
      },
    ],
  })

  console.log('Seeded bids successfully.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
