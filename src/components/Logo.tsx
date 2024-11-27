import { UtensilsCrossed } from 'lucide-react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-green-200 rounded-lg transform rotate-6"></div>
        <div className="relative bg-green-600 text-white p-2 rounded-lg">
          <UtensilsCrossed className="h-6 w-6" />
        </div>
      </div>
      <div className="ml-2 flex items-baseline">
        <span className="text-xl font-bold text-gray-900">LA</span>
        <span className="text-xl font-bold text-green-600">Canteen</span>
      </div>
    </div>
  );
}