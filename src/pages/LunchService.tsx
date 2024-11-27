import React, { useState } from 'react';
import { Utensils, AlertCircle } from 'lucide-react';
import CardScanner from '../components/CardScanner';
import toast from 'react-hot-toast';

export default function LunchService() {
  const [scannedCardId, setScannedCardId] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleCardScanned = async (cardId: string) => {
    setProcessing(true);
    try {
      // TODO: Replace with actual API call
      const hasSubscription = Math.random() > 0.3; // Mock check
      
      if (hasSubscription) {
        toast.success('Lunch service validated successfully!');
        // TODO: Record transaction
      } else {
        toast.error('No active lunch subscription found');
      }
    } catch (error) {
      toast.error('Failed to process lunch service');
    } finally {
      setProcessing(false);
      setScannedCardId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lunch Service</h2>
          <p className="mt-1 text-sm text-gray-500">
            Scan student card to validate lunch service
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-50 rounded-full">
                <Utensils className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {processing ? 'Processing...' : 'Ready to Scan'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Place the student's card on the reader to validate lunch service
              </p>
            </div>

            {!processing && (
              <div className="max-w-sm mx-auto">
                <CardScanner onScan={handleCardScanned} />
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <AlertCircle className="h-4 w-4 mr-2" />
                <p>Only students with active lunch subscriptions can access this service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}