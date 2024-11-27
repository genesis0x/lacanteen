import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  disabled: boolean;
}

export function CartItem({ id, name, price, quantity, onUpdateQuantity, disabled }: CartItemProps) {
  return (
    <li className="py-4">
      <div className="flex justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{name}</h4>
          <p className="mt-1 text-sm text-gray-500">{price.toFixed(2)} Points</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(id, quantity - 1)}
            disabled={disabled}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {quantity === 1 ? (
              <Trash2 className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <span className="text-sm font-medium w-8 text-center">
            {quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(id, quantity + 1)}
            disabled={disabled}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </li>
  );
}