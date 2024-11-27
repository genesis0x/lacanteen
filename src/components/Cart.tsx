import { Minus, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartProps {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => Promise<void>;
  scannedCardId: string;
  processing: boolean;
}

export default function Cart({ items, onUpdateQuantity, onCheckout, scannedCardId, processing }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!scannedCardId) {
      toast.error('Please scan a student card to complete the purchase');
      return;
    }
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    await onCheckout();
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No items in cart</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.id} className="py-4">
            <div className="flex justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                <p className="mt-1 text-sm text-gray-500">{item.price.toFixed(2)} Points</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  disabled={processing}
                >
                  {item.quantity === 1 ? (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                <span className="text-sm font-medium w-8 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  disabled={processing}
                >
                  <Plus className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between">
          <span className="text-base font-medium text-gray-900">Total</span>
          <span className="text-base font-medium text-gray-900">{total.toFixed(2)} Points</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={!scannedCardId || items.length === 0 || processing}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : !scannedCardId ? (
          'Scan Card to Purchase'
        ) : (
          'Complete Purchase'
        )}
      </button>
    </div>
  );
}