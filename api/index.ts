import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { sendPurchaseNotificationEmail } from '../src/lib/emailService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

function authenticateToken(
  req: VercelRequest,
  res: VercelResponse,
  handler: (req: VercelRequest, res: VercelResponse, user: AuthUser) => Promise<any>
): Promise<any> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return Promise.resolve(res.status(401).json({ error: 'No token provided' }));
  }

  return new Promise((resolve) => {
    jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
      if (err) {
        resolve(res.status(403).json({ error: 'Invalid token' }));
        return;
      }
      try {
        const result = await handler(req, res, user as AuthUser);
        resolve(result);
      } catch (error) {
        console.error('Handler error:', error);
        resolve(res.status(500).json({ error: 'Internal server error' }));
      }
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const routePath = Array.isArray(path) ? path.join('/') : path || '';

  try {
    switch (routePath) {
      case 'health':
        return res.status(200).json({ status: 'healthy' });

      case 'auth/login':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '8h' }
        );

        return res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        });

      case 'insights':
        return authenticateToken(req, res, async () => {
          const totalStudents = await prisma.student.count();
          const withCanteen = await prisma.student.count({
            where: { subscriptions: { some: { type: 'ANNUAL' } } },
          });
          const withGardeRepas = await prisma.student.count({
            where: { subscriptions: { some: { type: 'TERM' } } },
          });

          const recentTransactions = await prisma.transaction.groupBy({
            by: ['productId'],
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: 3,
          });

          return res.json({
            totalStudents,
            withCanteen,
            withGardeRepas,
            withoutSubscription: totalStudents - (withCanteen + withGardeRepas),
            recentTransactions,
          });
        });

      case 'students/card':
        return authenticateToken(req, res, async () => {
          const { cardId } = req.query;
          const student = await prisma.student.findUnique({
            where: { cardId: cardId as string },
            include: {
              subscriptions: {
                where: { endDate: { gte: new Date() } },
              },
            },
          });

          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }

          return res.json(student);
        });

      case 'students/credit':
        return authenticateToken(req, res, async () => {
          const { studentId, amount, type, subscriptionType } = req.body;

          if (type === 'balance') {
            const student = await prisma.student.update({
              where: { id: studentId },
              data: { balance: { increment: amount } },
            });
            return res.json(student);
          }

          if (type === 'subscription') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (subscriptionType === 'TERM' ? 4 : 12));

            const subscription = await prisma.subscription.create({
              data: {
                studentId,
                type: subscriptionType,
                amount,
                startDate,
                endDate,
              },
            });
            return res.json(subscription);
          }
        });

      case 'products':
        return authenticateToken(req, res, async () => {
          if (req.method === 'GET') {
            const products = await prisma.product.findMany();
            return res.json(products);
          }

          if (req.method === 'POST') {
            const { name, price, category } = req.body;
            const product = await prisma.product.create({
              data: { name, price, category },
            });
            return res.json(product);
          }

          if (req.method === 'PUT') {
            const { id } = req.query;
            const { name, price, category } = req.body;
            const product = await prisma.product.update({
              where: { id: id as string },
              data: { name, price, category },
            });
            return res.json(product);
          }
        });

      case 'transactions':
        return authenticateToken(req, res, async () => {
          const { studentId, items } = req.body;
          const student = await prisma.student.findUnique({
            where: { id: studentId },
          });

          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }

          const products = await prisma.product.findMany({
            where: { id: { in: items.map((item: any) => item.productId) } },
          });

          const totalAmount = items.reduce((sum: number, item: any) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product ? product.price * item.quantity : 0);
          }, 0);

          if (student.balance < totalAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
          }

          const [transactions] = await prisma.$transaction([
            prisma.transaction.createMany({
              data: items.map((item: any) => ({
                studentId,
                productId: item.productId,
                quantity: item.quantity,
                amount: products.find(p => p.id === item.productId)!.price * item.quantity,
              })),
            }),
            prisma.student.update({
              where: { id: studentId },
              data: { balance: { decrement: totalAmount } },
            }),
          ]);

          return res.json(transactions);
        });

      case 'history':
        return authenticateToken(req, res, async () => {
          const transactions = await prisma.transaction.findMany({
            include: {
              student: { select: { name: true, grade: true } },
              product: { select: { name: true, price: true } },
            },
            orderBy: { createdAt: 'desc' },
          });
          return res.json(transactions);
        });

      case 'checkout':
        return authenticateToken(req, res, async () => {
          const { cardId, total, items } = req.body;
          const student = await prisma.student.findUnique({
            where: { cardId },
            select: {
              id: true,
              cardId: true,
              balance: true,
              name: true,
              email: true,
            },
          });

          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }

          if (student.balance < total) {
            return res.status(400).json({ error: 'Insufficient balance' });
          }

          const result = await prisma.$transaction(async (tx) => {
            const updatedStudent = await tx.student.update({
              where: { cardId },
              data: { balance: { decrement: total } },
            });

            await sendPurchaseNotificationEmail(
              student.email,
              student.name,
              items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              total,
              updatedStudent.balance
            );

            const transactions = await Promise.all(
              items.map((item: any) =>
                tx.transaction.create({
                  data: {
                    studentId: student.id,
                    productId: item.id,
                    quantity: item.quantity,
                    amount: item.price * item.quantity,
                  },
                })
              )
            );

            return { student: updatedStudent, transactions };
          });

          return res.json({
            success: true,
            data: {
              balance: result.student.balance,
              studentName: result.student.name,
              transactionCount: result.transactions.length,
            },
          });
        });

      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}