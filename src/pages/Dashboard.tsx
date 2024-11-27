import  { useState, useEffect } from 'react';
import { CreditCard, Wallet, History, Nfc } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { fetchInsights, getStudentByCard } from '../lib/api';
import CardScanner from '../components/CardScanner';
import StudentInfo from '../components/StudentInfo';
import CreditForm from '../components/CreditForm';
import InsightsGrid from '../components/InsightsGrid';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [scannedId, setScannedId] = useState('');
  const [scanType, setScanType] = useState<'card' | 'code'>('card');
  const [studentData, setStudentData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        if (token) {
          const data = await fetchInsights(token);
          setInsights(data);
        }
      } catch (error) {
        toast.error('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [token]);

  const handleScan = async (id: string, type: 'card' | 'code') => {
    try {
      if (token) {
        const student = type === 'card' 
          ? await getStudentByCard(id, token)
          : await getStudentByCard(id, token);
        
        setScannedId(id);
        setScanType(type);
        setStudentData(student);
      }
    } catch (error) {
      toast.error(`Failed to fetch student data by ${type}`);
      setScannedId('');
      setStudentData(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Balance Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tap student card or scan external code to manage balance
          </p>
        </div>
      </div>

      {insights && <InsightsGrid insights={insights} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {!studentData ? (
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg">
              <div className="p-8">
                <div className="max-w-sm mx-auto">
                  <div className="text-center space-y-6 mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                          <Nfc className="h-16 w-16 text-green-600" />
                        </div>
                      </div>
                      <div className="w-32 h-32 mx-auto relative">
                        <div className="absolute inset-0 bg-green-50 rounded-full animate-ping opacity-20"></div>
                        <div className="relative flex items-center justify-center w-full h-full">
                          <CreditCard className="h-16 w-16 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Card Scanner</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Scan student card or external code below
                      </p>
                    </div>
                  </div>
                  <CardScanner onScan={handleScan} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <StudentInfo student={studentData} scanType={scanType} />
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Wallet className="h-6 w-6 text-green-600" />
                <h3 className="ml-2 text-lg font-medium text-gray-900">Add Credit</h3>
              </div>
              <CreditForm 
                  studentId={studentData.id}
                  onSuccess={() => {
                    handleScan(scannedId, scanType);
                  } } token={token ?? ''}              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}