import { NextResponse } from 'next/server';
import { checkAndUpdateBalance } from '../../../lib/db';
import { z } from 'zod';

// Input validation schema
const checkoutSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  total: z.number().positive('Total must be greater than 0'),
  items: z.array(z.object({
    id: z.string().min(1, 'Product ID is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    price: z.number().min(0, 'Price cannot be negative'),
  })).min(1, 'At least one item is required'),
});

export async function POST(request: Request) {
  try {
    if (!request.body) {
      return NextResponse.json(
        { success: false, error: 'Request body is required' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request data
    try {
      checkoutSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: error.errors[0].message },
          { status: 400 }
        );
      }
    }

    const result = await checkAndUpdateBalance(body.cardId, body.total, body.items);

    return NextResponse.json({
      success: true,
      data: {
        balance: result.student.balance,
        studentName: result.student.name,
        transactions: result.transactions,
      }
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process purchase'
      },
      { status: 400 }
    );
  }
}