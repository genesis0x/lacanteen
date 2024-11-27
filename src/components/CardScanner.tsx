import React, { useState, useRef, useEffect } from 'react';
import { CreditCard, QrCode } from 'lucide-react';

interface CardScannerProps {
  onScan: (cardId: string, type: 'card' | 'code') => void;
}

export default function CardScanner({ onScan }: CardScannerProps) {
  const [input, setInput] = useState('');
  const [scanType, setScanType] = useState<'card' | 'code'>('card');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const focusInterval = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 100);

    return () => clearInterval(focusInterval);
  }, []);

  useEffect(() => {
    if (input.length >= 8) {
      handleSubmit();
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      onScan(input.trim(), scanType);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setScanType('card')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${
            scanType === 'card'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Card ID</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setScanType('code')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${
            scanType === 'code'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <QrCode className="h-4 w-4" />
            <span>External Code</span>
          </div>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {scanType === 'card' ? (
            <CreditCard className="h-5 w-5 text-gray-400" />
          ) : (
            <QrCode className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder={`Scan ${scanType === 'card' ? 'card ID' : 'external code'}...`}
          autoComplete="off"
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        {`Scan ${scanType === 'card' ? 'Card' : 'Code'}`}
      </button>
    </form>
  );
}