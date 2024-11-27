interface CheckoutButtonProps {
    onClick: () => Promise<void>;
    disabled: boolean;
    isProcessing: boolean;
    hasCard: boolean;
  }
  
  export function CheckoutButton({ onClick, disabled, isProcessing, hasCard }: CheckoutButtonProps) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          'Processing...'
        ) : hasCard ? (
          'Complete Purchase'
        ) : (
          'Scan Card to Purchase'
        )}
      </button>
    );
  }