import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get the current counter value
    const counter = await prisma.counter.findUnique({ where: { id: 1 } });
    res.status(200).json({ count: counter?.count || 0 });
  } else if (req.method === 'POST') {
    // Increment the counter value
    const counter = await prisma.counter.upsert({
      where: { id: 1 },
      update: { count: { increment: 1 } },
      create: { id: 1, count: 1 },
    });
    res.status(200).json({ count: counter.count });
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
