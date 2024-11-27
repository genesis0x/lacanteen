interface CartTotalProps {
    total: number;
  }
  
  export function CartTotal({ total }: CartTotalProps) {
    return (
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between">
          <span className="text-base font-medium text-gray-900">Total</span>
          <span className="text-base font-medium text-gray-900">{total.toFixed(2)} Points</span>
        </div>
      </div>
    );
  }