import { Users, Coffee, XCircle, TrendingUp } from 'lucide-react';

interface InsightsProps {
  insights: {
    totalStudents: number;
    withCanteen: number;
    withGardeRepas: number;
    withoutSubscription: number;
    recentTransactions: Array<{
      id: number;
      type: string;
      count: number;
      trend: string;
    }>;
  };
}

export default function InsightsGrid({ insights }: InsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Total Students</p>
            <p className="text-2xl font-semibold text-gray-900">{insights.totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <Coffee className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Canteen Plan</p>
            <p className="text-2xl font-semibold text-gray-900">{insights.withCanteen}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Coffee className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Garde Repas</p>
            <p className="text-2xl font-semibold text-gray-900">{insights.withGardeRepas}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-50 rounded-lg">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">No Subscription</p>
            <p className="text-2xl font-semibold text-gray-900">{insights.withoutSubscription}</p>
          </div>
        </div>
      </div>
{/* 
      <div className="lg:col-span-4">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h3 className="ml-2 text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-600">{transaction.type}</p>
                  <span className="text-sm text-green-600">{transaction.trend}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{transaction.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
}
