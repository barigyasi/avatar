import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../components/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const counter = await prisma.counter.findUnique({
        where: { id: 1 },
      });
      res.status(200).json({ count: counter?.count || 0 });
    } else if (req.method === 'POST') {
      const updatedCounter = await prisma.counter.update({
        where: { id: 1 },
        data: {
          count: {
            increment: 1,
          },
        },
      });
      res.status(200).json({ count: updatedCounter.count });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("Error in /api/counter: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
