import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { sendPurchaseNotificationEmail } from '../src/lib/emailService'

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fuckfuckfuckfuckfuck';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get student insights
app.get('/api/insights', authenticateToken, async (req, res) => {
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

    res.json({
      totalStudents,
      withCanteen,
      withGardeRepas,
      withoutSubscription: totalStudents - (withCanteen + withGardeRepas),
      recentTransactions,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by card ID
app.get('/api/students/card/:cardId', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { cardId: req.params.cardId },
      include: {
        subscriptions: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add credit to student
app.post('/api/students/:id/credit', authenticateToken, async (req, res) => {
  try {
    const { amount, type, subscriptionType } = req.body;
    const studentId = req.params.id;

    if (type === 'balance') {
      const student = await prisma.student.update({
        where: { id: studentId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
      res.json(student);
    } else if (type === 'subscription') {
      const startDate = new Date();
      const endDate = new Date();
      if (subscriptionType === 'TERM') {
        endDate.setMonth(endDate.getMonth() + 4);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription = await prisma.subscription.create({
        data: {
          studentId,
          type: subscriptionType,
          amount,
          startDate,
          endDate,
        },
      });
      res.json(subscription);
    }
  } catch (error) {
    console.error('Error adding credit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { studentId, items } = req.body;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: items.map((item: { productId: any; }) => item.productId),
        },
      },
    });

    const totalAmount = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    if (student.balance < totalAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const [transactions] = await prisma.$transaction([
      prisma.transaction.createMany({
        data: items.map(item => {
          const product = products.find(p => p.id === item.productId)!;
          return {
            studentId,
            productId: item.productId,
            quantity: item.quantity,
            amount: product.price * item.quantity,
          };
        }),
      }),
      prisma.student.update({
        where: { id: studentId },
        data: {
          balance: {
            decrement: totalAmount,
          },
        },
      }),
    ]);

    res.json(transactions);
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction history
app.get('/api/transactions/history', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        student: true,
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const topProducts = await prisma.transaction.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    res.json({
      transactions,
      topProducts,
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    const { cardId, name, grade, email, externalCode } = req.body;

    // if (!email) {
    //   return res.status(400).json({ error: 'Email is required' });
    // }

    const newStudent = await prisma.student.create({
      data: {
        cardId,
        name,
        grade,
        email,
        externalCode,
      },
    });

    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});


app.post('/api/checkout', authenticateToken, async (req, res) => {
  const { cardId, total, items } = req.body;

  try {
    // First, verify the student exists and has sufficient balance
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

    // Verify all products exist before proceeding
    const productIds = items.map((item: { id: any; }) => item.id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update student balance
      const updatedStudent = await tx.student.update({
        where: { cardId },
        data: {
          balance: {
            decrement: total,
          },
        },
      });

      // Send email notification
      await sendPurchaseNotificationEmail(
        student.email,
        student.name,
        items.map((item: { name: any; quantity: any; price: any; }) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
        updatedStudent.balance
      );

      // Create individual transactions for better error handling
      const transactions = await Promise.all(
        items.map((item: { id: any; quantity: number; price: number; }) =>
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

      return {
        student: updatedStudent,
        transactions,
      };
    });

    return res.json({
      success: true,
      data: {
        balance: result.student.balance,
        studentName: result.student.name,
        transactionCount: result.transactions.length,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// Create product
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, price, category } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        category,
      },
    });

    res.json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        price,
        category,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        student: {
          select: {
            name: true,
            grade: true,
          },
        },
        product: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // console.log('Fetched transactions:', transactions); // Log the fetched transactions
    return res.json(transactions); // Return the fetched transactions
  } catch (error) {
    console.error('Error fetching transactions:', error); // Log the error
    return res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Endpoint to update student photo by externalCode
app.put('/api/students/:externalCode/photo', async (req, res) => {
  const { externalCode } = req.params;
  const { photoUrl } = req.body;
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from headers

  // Check if the token is valid (this part depends on your authentication logic)
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find the student by externalCode
    const student = await prisma.student.findUnique({
      where: { externalCode },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update the student's photo
    const updatedStudent = await prisma.student.update({
      where: { externalCode },
      data: { photo: photoUrl },
    });

    // Respond with the updated student data
    return res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student photo:', error);
    return res.status(500).json({ error: 'Failed to update student photo' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(3001, () => {
  console.log(`Server running on port ${PORT}`);
});
