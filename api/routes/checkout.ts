import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPurchaseNotificationEmail } from '../../src/lib/emailService';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { cardId, items } = req.body;

    // Find student with card ID
    const student = await prisma.student.findUnique({
      where: { cardId },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Calculate total purchase amount
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check if student has sufficient balance
    if (student.balance < total) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create transactions
    const transactions = await Promise.all(
      items.map(item =>
        prisma.transaction.create({
          data: {
            studentId: student.id,
            productId: item.id,
            quantity: item.quantity,
            amount: item.price * item.quantity,
          },
          include: {
            product: true,
          },
        })
      )
    );

    // Update student balance
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        balance: student.balance - total,
      },
    });

    // Send email notification
    await sendPurchaseNotificationEmail(
      student.email,
      student.name,
      items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total,
      updatedStudent.balance
    );

    res.json({
      success: true,
      data: {
        transactions,
        balance: updatedStudent.balance,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

export default router;