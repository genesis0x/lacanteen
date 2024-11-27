export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }
  
  export interface CheckoutRequestData {
    cardId: string;
    total: number;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
    }>;
  }
  
  export interface CheckoutResponseData {
    success: boolean;
    data?: {
      balance: number;
      studentName: string;
      transactions: Array<{
        id: string;
        amount: number;
        quantity: number;
        createdAt: string;
      }>;
    };
    error?: string;
  }