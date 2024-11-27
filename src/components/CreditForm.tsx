import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { addCredit } from '../lib/api';

interface CreditFormProps {
  studentId: string;
  onSuccess: () => void;
  token: string;
}

export default function CreditForm({ studentId, token, onSuccess }: CreditFormProps) {
  const [type, setType] = useState<'balance' | 'subscription'>('balance');
  const [amount, setAmount] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'TERM' | 'ANNUAL'>('TERM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addCredit(
        studentId,
        parseFloat(amount),
        type,
        token,
        type === 'subscription' ? subscriptionType : undefined
      );
      
      toast.success('Credit added successfully!');
      setAmount('');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add credit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Credit Type</label>
        <div className="mt-1">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'balance' | 'subscription')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
            disabled={isSubmitting}
          >
            <option value="balance">Add Balance</option>
            <option value="subscription">Add Subscription</option>
          </select>
        </div>
      </div>

      {type === 'subscription' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
          <select
            value={subscriptionType}
            onChange={(e) => setSubscriptionType(e.target.value as 'TERM' | 'ANNUAL')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
            disabled={isSubmitting}
          >
            <option value="TERM">Term Plan</option>
            <option value="ANNUAL">Annual Plan</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Amount (Points)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
          placeholder="Enter amount"
          disabled={isSubmitting}
          required
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adding Credit...' : 'Add Credit'}
      </button>
    </form>
  );
}