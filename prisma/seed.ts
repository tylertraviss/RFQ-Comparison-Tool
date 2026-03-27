import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  await prisma.bid.createMany({
    data: [
      // WON
      { partNumber: 'MS21042-3',    description: 'Nut, Self-Locking',            supplierName: 'Apex Defense Supply',        unitCost: 0.78,   unitSell: 0.92,   unitProfit: 0.14,  quantity: 500,  leadTimeDays: 14, markup: 18, status: 'WON', bidDate: new Date('2026-02-04') },
      { partNumber: 'AN3-5A',       description: 'Bolt, Machine',                supplierName: 'Ironclad Fastener Co.',      unitCost: 2.10,   unitSell: 2.52,   unitProfit: 0.42,  quantity: 150,  leadTimeDays: 21, markup: 20, status: 'WON', bidDate: new Date('2026-02-08') },
      { partNumber: 'NAS1149C0363R',description: 'Washer, Flat',                 supplierName: 'Patriot Hardware Solutions', unitCost: 0.29,   unitSell: 0.34,   unitProfit: 0.05,  quantity: 500,  leadTimeDays: 18, markup: 17, status: 'WON', bidDate: new Date('2026-02-12') },
      { partNumber: 'MS35206-242',  description: 'Screw, Machine',               supplierName: 'Apex Defense Supply',        unitCost: 1.15,   unitSell: 1.38,   unitProfit: 0.23,  quantity: 200,  leadTimeDays: 25, markup: 20, status: 'WON', bidDate: new Date('2026-02-18') },
      { partNumber: 'MS9226-09',    description: 'Ring, Retaining',              supplierName: 'Ironclad Fastener Co.',      unitCost: 3.40,   unitSell: 4.08,   unitProfit: 0.68,  quantity: 100,  leadTimeDays: 30, markup: 20, status: 'WON', bidDate: new Date('2026-02-20') },
      { partNumber: 'AN525-10R8',   description: 'Screw, Flat Head',             supplierName: 'Patriot Hardware Solutions', unitCost: 0.55,   unitSell: 0.65,   unitProfit: 0.10,  quantity: 300,  leadTimeDays: 14, markup: 18, status: 'WON', bidDate: new Date('2026-02-24') },
      { partNumber: 'MS27039-0-6',  description: 'Screw, Pan Head',              supplierName: 'Apex Defense Supply',        unitCost: 0.62,   unitSell: 0.74,   unitProfit: 0.12,  quantity: 250,  leadTimeDays: 16, markup: 19, status: 'WON', bidDate: new Date('2026-03-01') },
      { partNumber: 'NAS623-3-6',   description: 'Bolt, Hex Head',               supplierName: 'Ironclad Fastener Co.',      unitCost: 1.88,   unitSell: 2.26,   unitProfit: 0.38,  quantity: 120,  leadTimeDays: 22, markup: 20, status: 'WON', bidDate: new Date('2026-03-04') },
      { partNumber: 'MS21919DG8',   description: 'Clamp, Loop',                  supplierName: 'Patriot Hardware Solutions', unitCost: 4.20,   unitSell: 5.04,   unitProfit: 0.84,  quantity: 75,   leadTimeDays: 28, markup: 20, status: 'WON', bidDate: new Date('2026-03-07') },
      { partNumber: 'AN4-10A',      description: 'Bolt, AN Standard',            supplierName: 'Apex Defense Supply',        unitCost: 2.95,   unitSell: 3.54,   unitProfit: 0.59,  quantity: 90,   leadTimeDays: 18, markup: 20, status: 'WON', bidDate: new Date('2026-03-10') },
      { partNumber: 'MS35338-44',   description: 'Washer, Spring Lock',          supplierName: 'Ironclad Fastener Co.',      unitCost: 0.18,   unitSell: 0.21,   unitProfit: 0.03,  quantity: 600,  leadTimeDays: 10, markup: 17, status: 'WON', bidDate: new Date('2026-03-13') },
      { partNumber: 'NAS1352C06-8', description: 'Screw, Self-Tapping',          supplierName: 'Patriot Hardware Solutions', unitCost: 0.71,   unitSell: 0.85,   unitProfit: 0.14,  quantity: 200,  leadTimeDays: 15, markup: 20, status: 'WON', bidDate: new Date('2026-03-16') },
      { partNumber: 'MS21042-06',   description: 'Nut, Plain Hex',               supplierName: 'Apex Defense Supply',        unitCost: 0.44,   unitSell: 0.52,   unitProfit: 0.08,  quantity: 400,  leadTimeDays: 12, markup: 18, status: 'WON', bidDate: new Date('2026-03-18') },

      // WAITING
      { partNumber: 'AN960-10',     description: 'Washer, Plain',                supplierName: 'Ironclad Fastener Co.',      unitCost: 0.15,   unitSell: 0.18,   unitProfit: 0.03,  quantity: 300,  leadTimeDays: 12, markup: 18, status: 'WAITING', bidDate: new Date('2026-03-20') },
      { partNumber: 'MS21042-4',    description: 'Nut, Self-Locking, #8',        supplierName: 'Patriot Hardware Solutions', unitCost: 0.91,   unitSell: 1.08,   unitProfit: 0.17,  quantity: 400,  leadTimeDays: 20, markup: 18, status: 'WAITING', bidDate: new Date('2026-03-21') },
      { partNumber: 'MS24694-S51',  description: 'Screw, Flat Head, 100 Deg',    supplierName: 'Apex Defense Supply',        unitCost: 0.83,   unitSell: 0.99,   unitProfit: 0.16,  quantity: 175,  leadTimeDays: 17, markup: 19, status: 'WAITING', bidDate: new Date('2026-03-22') },
      { partNumber: 'AN365-428A',   description: 'Nut, Self-Locking, Thin',      supplierName: 'Ironclad Fastener Co.',      unitCost: 1.02,   unitSell: 1.22,   unitProfit: 0.20,  quantity: 250,  leadTimeDays: 22, markup: 20, status: 'WAITING', bidDate: new Date('2026-03-22') },
      { partNumber: 'NAS1801-3-12', description: 'Bolt, Close Tolerance',        supplierName: 'Patriot Hardware Solutions', unitCost: 3.75,   unitSell: 4.50,   unitProfit: 0.75,  quantity: 60,   leadTimeDays: 35, markup: 20, status: 'WAITING', bidDate: new Date('2026-03-23') },
      { partNumber: 'MS21919WDG6',  description: 'Clamp, Loop, Cushioned',       supplierName: 'Apex Defense Supply',        unitCost: 5.10,   unitSell: 6.12,   unitProfit: 1.02,  quantity: 50,   leadTimeDays: 30, markup: 20, status: 'WAITING', bidDate: new Date('2026-03-24') },
      { partNumber: 'AN970-4',      description: 'Washer, Large Area',           supplierName: 'Ironclad Fastener Co.',      unitCost: 0.33,   unitSell: 0.39,   unitProfit: 0.06,  quantity: 450,  leadTimeDays: 14, markup: 18, status: 'WAITING', bidDate: new Date('2026-03-24') },
      { partNumber: 'MS35649-244',  description: 'Nut, Plain, Hex, Coarse',      supplierName: 'Patriot Hardware Solutions', unitCost: 0.27,   unitSell: 0.32,   unitProfit: 0.05,  quantity: 550,  leadTimeDays: 11, markup: 18, status: 'WAITING', bidDate: new Date('2026-03-25') },
      { partNumber: 'AN hardware-5',description: 'Pin, Cotter',                  supplierName: 'Apex Defense Supply',        unitCost: 0.19,   unitSell: 0.22,   unitProfit: 0.03,  quantity: 800,  leadTimeDays: 9,  markup: 16, status: 'WAITING', bidDate: new Date('2026-03-25') },
      { partNumber: 'NAS464P3-6',   description: 'Pin, Roll',                    supplierName: 'Ironclad Fastener Co.',      unitCost: 0.48,   unitSell: 0.57,   unitProfit: 0.09,  quantity: 350,  leadTimeDays: 15, markup: 19, status: 'WAITING', bidDate: new Date('2026-03-26') },

      // LOST
      { partNumber: 'AN960-416L',   description: 'Washer, Plain, Light',         supplierName: 'Apex Defense Supply',        unitCost: 0.22,   unitSell: 0.26,   unitProfit: 0.04,  quantity: 600,  leadTimeDays: 16, markup: 18, status: 'LOST', lostBy: 0.03, bidDate: new Date('2026-02-14') },
      { partNumber: 'NAS1149D0432J',description: 'Washer, Flat, Steel',          supplierName: 'Ironclad Fastener Co.',      unitCost: 0.44,   unitSell: 0.52,   unitProfit: 0.08,  quantity: 250,  leadTimeDays: 22, markup: 18, status: 'LOST', lostBy: 0.07, bidDate: new Date('2026-02-19') },
      { partNumber: 'MS51957-26',   description: 'Screw, Drive, Type U',         supplierName: 'Patriot Hardware Solutions', unitCost: 0.38,   unitSell: 0.45,   unitProfit: 0.07,  quantity: 400,  leadTimeDays: 14, markup: 18, status: 'LOST', lostBy: 0.04, bidDate: new Date('2026-02-25') },
      { partNumber: 'AN3-6A',       description: 'Bolt, Machine, 3/8in',         supplierName: 'Apex Defense Supply',        unitCost: 2.30,   unitSell: 2.76,   unitProfit: 0.46,  quantity: 100,  leadTimeDays: 24, markup: 20, status: 'LOST', lostBy: 0.12, bidDate: new Date('2026-03-03') },
      { partNumber: 'MS21083N4',    description: 'Nut, Self-Locking, Hex Thin',  supplierName: 'Ironclad Fastener Co.',      unitCost: 1.05,   unitSell: 1.26,   unitProfit: 0.21,  quantity: 200,  leadTimeDays: 19, markup: 20, status: 'LOST', lostBy: 0.09, bidDate: new Date('2026-03-09') },
    ],
  })

  console.log('Seeded bids successfully.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
