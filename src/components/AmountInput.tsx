
import React from 'react';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface AmountInputProps {
  amount: number;
  onAmountChange: (amount: number) => void;
  maxAmount: number;
}

const AmountInput = ({ amount, onAmountChange, maxAmount }: AmountInputProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    const clampedValue = Math.min(Math.max(0, value), maxAmount);
    onAmountChange(clampedValue);
  };

  const quickAmounts = [
    { label: '25%', value: maxAmount * 0.25 },
    { label: '50%', value: maxAmount * 0.5 },
    { label: '75%', value: maxAmount * 0.75 },
    { label: 'MAX', value: maxAmount }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      <p className="text-center text-gray-400 mb-4">Amount to Trade</p>
      
      <div className="relative mb-4">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="number"
          value={amount || ''}
          onChange={handleInputChange}
          placeholder="0"
          className="pl-10 text-center text-xl font-bold bg-gray-700/50 border-gray-600 text-white"
          max={maxAmount}
          min="0"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickAmounts.map((quick) => (
          <button
            key={quick.label}
            onClick={() => onAmountChange(quick.value)}
            className="py-2 px-3 text-sm font-medium bg-gray-700/50 hover:bg-gray-600/50 rounded-lg border border-gray-600 text-gray-300 hover:text-white transition-all duration-200"
          >
            {quick.label}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-500 mt-2">
        Max: ${maxAmount.toLocaleString()}
      </p>
    </div>
  );
};

export default AmountInput;
