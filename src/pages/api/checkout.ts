import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { cardId, items, totalAmount } = req.body;

    // Validate request
    if (!cardId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find student by card ID
      const student = await tx.student.findUnique({
        where: { cardId },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student has sufficient balance
      if (student.balance < totalAmount) {
        throw new Error('Insufficient balance');
      }

      // Create transactions for each item
      const transactions = await Promise.all(
        items.map(item => 
          tx.transaction.create({
            data: {
              studentId: student.id,
              productId: item.productId,
              quantity: item.quantity,
              amount: item.amount,
            },
          })
        )
      );

      // Update student balance
      await tx.student.update({
        where: { id: student.id },
        data: {
          balance: {
            decrement: totalAmount
          }
        }
      });

      return {
        transactions,
        updatedBalance: student.balance - totalAmount
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to process checkout',
    });
  }
}
