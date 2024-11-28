import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const totalStudents = await prisma.student.count();
    const withCanteen = await prisma.student.count({
      where: {
        subscriptions: {
          some: {
            type: 'ANNUAL',
          },
        },
      },
    });
    const withGardeRepas = await prisma.student.count({
      where: {
        subscriptions: {
          some: {
            type: 'TERM',
          },
        },
      },
    });

    const recentTransactions = await prisma.transaction.groupBy({
      by: ['productId'],
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 3,
    });

    return NextResponse.json({
      totalStudents,
      withCanteen,
      withGardeRepas,
      withoutSubscription: totalStudents - (withCanteen + withGardeRepas),
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}