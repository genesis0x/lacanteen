import { useState } from 'react';
import { ShoppingCart, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import CardScanner from '../components/CardScanner';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function PointOfSale() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scannedCardId, setScannedCardId] = useState('');
  const [processing, setProcessing] = useState(false);
  const token = useAuthStore((state) => state.token);

  const handleAddToCart = (product: { id: string; name: string; price: number }) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart(currentCart =>
      quantity === 0
        ? currentCart.filter(item => item.id !== productId)
        : currentCart.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
    );
  };

  const resetCart = () => {
    setCart([]);
    setScannedCardId('');
  };

  const handleCheckout = async () => {
    if (!scannedCardId || cart.length === 0) {
      toast.error('Please scan a card and add items to cart');
      return;
    }

    setProcessing(true);
    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardId: scannedCardId,
          total,
          items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const result = await response.json();
      
      toast.success(`Purchase complete! New balance: ${result.data.balance.toFixed(2)} Points`);
      resetCart();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
      // Don't reset cart on network errors
      if (!(error instanceof TypeError)) {
        resetCart();
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Point of Sale</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select products and scan student card to complete purchase
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Tag className="h-6 w-6 text-green-600" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Products</h3>
            </div>
            <ProductGrid onAddToCart={handleAddToCart} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Cart</h3>
            </div>
            <Cart
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onCheckout={handleCheckout}
              scannedCardId={scannedCardId}
              processing={processing}
            />
            {cart.length > 0 && !scannedCardId && (
              <div className="mt-4">
                <CardScanner onScan={setScannedCardId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}