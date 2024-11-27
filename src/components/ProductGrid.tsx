import  { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL;

interface Product {
  id: string;
  name: string;
  price: number;
  category: 'FOOD' | 'BEVERAGE' | 'SNACK';
}

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-sm transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-600">
                {product.name}
              </h4>
              <p className="mt-1 text-sm text-gray-500">{product.category.toLowerCase()}</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {product.price.toFixed(2)} Points
            </span>
          </div>
          <div className="mt-4 flex justify-end">
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
          </div>
        </button>
      ))}
    </div>
  );
}