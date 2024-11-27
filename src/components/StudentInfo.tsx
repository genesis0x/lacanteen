import { User, Calendar, CreditCard, QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface StudentInfoProps {
  student: {
    name: string;
    grade: string;
    balance: number;
    cardId: string;
    externalCode: string;
    subscriptions: Array<{
      type: string;
      endDate: string;
      amount: number;
    }>;
  };
  scanType: 'card' | 'code';
}

export default function StudentInfo({ student, scanType }: StudentInfoProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <User className="h-6 w-6 text-green-600" />
        <h3 className="ml-2 text-lg font-medium text-gray-900">Student Information</h3>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Grade</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.grade}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Current Balance</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.balance.toFixed(2)} Points</dd>
          </div>
          <div>
            <dt className="flex items-center text-sm font-medium text-gray-500">
              {scanType === 'card' ? (
                <>
                  <CreditCard className="h-4 w-4 mr-1" />
                  <span>Card ID</span>
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-1" />
                  <span>External Code</span>
                </>
              )}
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {scanType === 'card' ? student.cardId : student.externalCode}
            </dd>
          </div>
        </dl>
      </div>

      {student.subscriptions.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-green-600" />
            <h4 className="ml-2 text-sm font-medium text-gray-900">Active Subscriptions</h4>
          </div>
          <ul className="space-y-3">
            {student.subscriptions.map((sub, index) => (
              <li key={index} className="bg-green-50 rounded-md p-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-green-800">{sub.type} Plan</span>
                  <span className="text-sm text-green-800">{sub.amount.toFixed(2)} Points</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Valid until: {format(new Date(sub.endDate), 'PPP')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}