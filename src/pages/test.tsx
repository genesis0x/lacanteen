import React, { useState } from 'react';
import { ShoppingCart, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CardScanner from '../components/CardScanner';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';

export default function PointOfSale() {
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
  const [scannedCardId, setScannedCardId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleCheckout = async () => {
    if (!scannedCardId) {
      toast.error('Please scan a student card first');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: scannedCardId,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            amount: item.price * item.quantity
          })),
          totalAmount
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Checkout failed');
      }

      const result = await response.json();
      toast.success('Purchase completed successfully!');
      
      // Reset cart and scanned card after successful checkout
      setCart([]);
      setScannedCardId('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process checkout');
    } finally {
      setIsProcessing(false);
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
              isProcessing={isProcessing}
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