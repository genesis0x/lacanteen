import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkAndUpdateBalance(cardId: string, total: number, items: Array<{ id: string; quantity: number; price: number }>) {
  try {
    const student = await prisma.student.findUnique({
      where: { cardId },
    });

    if (!student) {
      throw new Error('Student card not found');
    }

    if (student.balance < total) {
      throw new Error('Insufficient balance');
    }

    // Update the balance and create transactions in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Recheck balance to prevent race conditions
      const currentStudent = await tx.student.findUnique({
        where: { cardId },
        select: {
          id: true,
          balance: true,
        },
      });

      if (!currentStudent || currentStudent.balance < total) {
        throw new Error('Insufficient balance');
      }

      // Update student balance
      const updatedStudent = await tx.student.update({
        where: { cardId },
        data: {
          balance: currentStudent.balance - total,
        },
        select: {
          id: true,
          balance: true,
          name: true,
        },
      });

      // Create transaction records for each item
      const transactions = await Promise.all(
        items.map((item) =>
          tx.transaction.create({
            data: {
              studentId: currentStudent.id,
              productId: item.id,
              amount: item.price * item.quantity,
              quantity: item.quantity,
            },
            select: {
              id: true,
              amount: true,
              quantity: true,
              createdAt: true,
            },
          })
        )
      );

      return {
        student: updatedStudent,
        transactions,
      };
    });

    return result;
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}