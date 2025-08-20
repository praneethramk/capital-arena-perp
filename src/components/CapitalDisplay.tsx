
import React from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface CapitalDisplayProps {
  amount: number;
  leverage: number;
  position: 'up' | 'down' | null;
  pnl: number;
  walletBalance?: number;
  walletCurrency?: string;
}

const CapitalDisplay = ({ amount, leverage, position, pnl, walletBalance, walletCurrency }: CapitalDisplayProps) => {
  const commandingCapital = amount * leverage;
  
  if (!position) {
    return (
      <div className="bg-gradient-to-r from-gray-800/30 to-gray-700/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-2">Ready to Command</p>
          <p className="text-3xl font-bold text-gray-300">
            ${commandingCapital.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            ${amount.toLocaleString()} × {leverage}x leverage
          </p>
          {walletBalance !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-600/30">
              <p className="text-xs text-gray-400">Wallet Balance</p>
              <p className="text-sm font-medium text-blue-400">
                {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {walletCurrency}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${
      position === 'up' 
        ? 'from-green-900/40 to-green-700/40 border-green-500/50' 
        : 'from-red-900/40 to-red-700/40 border-red-500/50'
    } backdrop-blur-sm rounded-2xl p-6 border-2 animate-pulse`}>
      {/* Striking background effect */}
      <div className={`absolute inset-0 ${
        position === 'up' ? 'bg-green-400/10' : 'bg-red-400/10'
      } animate-ping`} />
      
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center mb-2">
          {position === 'up' ? (
            <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-400 mr-2" />
          )}
          <p className={`text-sm font-bold ${
            position === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            COMMANDING CAPITAL
          </p>
          <Zap className="h-4 w-4 ml-2 text-yellow-400" />
        </div>
        
        <p className={`text-4xl font-black ${
          position === 'up' ? 'text-green-300' : 'text-red-300'
        } drop-shadow-lg`}>
          ${commandingCapital.toLocaleString()}
        </p>
        
        <div className="flex justify-center items-center space-x-4 mt-3">
          <span className="text-gray-400 text-sm">
            ${amount.toLocaleString()} × {leverage}x
          </span>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            pnl >= 0 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Striking border animation */}
      <div className={`absolute inset-0 rounded-2xl border-2 ${
        position === 'up' ? 'border-green-400/50' : 'border-red-400/50'
      } animate-pulse`} />
    </div>
  );
};

export default CapitalDisplay;
