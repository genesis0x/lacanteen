import { useEffect, useState } from 'react';
import { History as HistoryIcon, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

type Transaction = {
  id: string;
  student: { name: string; grade: string };
  product: { name: string; price: number };
  quantity: number;
  amount: number;
  createdAt: string;
};

type Product = {
  name: string;
  count: number;
};

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Example top products (replace with dynamic data if needed)
  const topProducts: Product[] = [
    { name: 'Chicken Sandwich', count: 150 },
    { name: 'Water Bottle', count: 120 },
    { name: 'Fresh Juice', count: 90 },
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Assuming the token is stored in localStorage or a context/state
        const token = localStorage.getItem('token'); // Replace with your token storage method
  
        if (!token) {
          throw new Error('No authentication token found');
        }
  
        const response = await fetch(`${API_URL}/api/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Send the Bearer token
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        setTransactions(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(`Failed to fetch transactions: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTransactions();
  }, []);
  


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <p className="mt-1 text-sm text-gray-500">View all transactions and analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <HistoryIcon className="h-6 w-6 text-green-600" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.student.name}
                        </div>
                        <div className="text-sm text-gray-500">{transaction.student.grade}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.product.name}</div>
                        <div className="text-sm text-gray-500">Qty: {transaction.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.amount.toFixed(2)} Points
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Top Products</h3>
            </div>
            <ul className="space-y-4">
              {topProducts.map((product, index) => (
                <li key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}. {product.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{product.count} sales</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
