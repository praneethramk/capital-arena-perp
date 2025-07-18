
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import PriceChart from './PriceChart';
import AmountInput from './AmountInput';
import CapitalDisplay from './CapitalDisplay';

const TradingArena = () => {
  const [capital, setCapital] = useState(10000);
  const [tradeAmount, setTradeAmount] = useState(1000);
  const [leverage, setLeverage] = useState([10]);
  const [position, setPosition] = useState<'up' | 'down' | null>(null);
  const [pnl, setPnl] = useState(0);
  const [marketPrice, setMarketPrice] = useState(50000);
  const [entryPrice, setEntryPrice] = useState(0);
  const [capitalInMarket, setCapitalInMarket] = useState(0);
  const [flashPnl, setFlashPnl] = useState<{ amount: number; type: 'profit' | 'loss' } | null>(null);

  // Simulate market price movement
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketPrice(prev => {
        const change = (Math.random() - 0.5) * 100;
        return Math.max(45000, Math.min(55000, prev + change));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate PnL when price changes
  useEffect(() => {
    if (position && entryPrice && capitalInMarket) {
      const priceChange = marketPrice - entryPrice;
      const direction = position === 'up' ? 1 : -1;
      const newPnl = (priceChange / entryPrice) * capitalInMarket * direction;
      
      if (Math.abs(newPnl - pnl) > 10) {
        const change = newPnl - pnl;
        setFlashPnl({
          amount: change,
          type: change > 0 ? 'profit' : 'loss'
        });
        
        setTimeout(() => setFlashPnl(null), 2000);
      }
      
      setPnl(newPnl);
    }
  }, [marketPrice, position, entryPrice, capitalInMarket, pnl]);

  const handleTrade = (direction: 'up' | 'down') => {
    if (position) {
      // Exit position
      setCapital(prev => prev + pnl);
      setPosition(null);
      setPnl(0);
      setCapitalInMarket(0);
      setEntryPrice(0);
    } else {
      // Enter position
      const commandingCapital = tradeAmount * leverage[0];
      setPosition(direction);
      setEntryPrice(marketPrice);
      setCapitalInMarket(commandingCapital);
      setCapital(prev => prev - tradeAmount);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4">
      {/* Flash PnL Animation */}
      {flashPnl && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold z-50 animate-scale-in ${
          flashPnl.type === 'profit' ? 'text-green-400' : 'text-red-400'
        }`}>
          {flashPnl.type === 'profit' ? '🔥' : '💥'} {flashPnl.amount > 0 ? '+' : ''}{formatCurrency(flashPnl.amount)}
        </div>
      )}

      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            SUDO THRUST
          </h1>
          <p className="text-gray-400 mt-2">Command the Market</p>
        </div>

        {/* Capital Display - Now prominent at top */}
        <CapitalDisplay 
          amount={tradeAmount}
          leverage={leverage[0]}
          position={position}
          pnl={pnl}
        />

        {/* Price Chart */}
        <PriceChart currentPrice={marketPrice} />

        {/* Market Price */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 text-sm">BTC/USD</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(marketPrice)}</p>
          </div>
        </div>

        {/* Available Capital */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-2xl p-4 border border-yellow-600/30">
          <div className="text-center">
            <p className="text-yellow-400 text-sm">Available Capital</p>
            <p className="text-xl font-bold text-yellow-300">{formatCurrency(capital)}</p>
          </div>
        </div>

        {/* Trade Controls - Only show when not in position */}
        {!position && (
          <>
            <AmountInput 
              amount={tradeAmount}
              onAmountChange={setTradeAmount}
              maxAmount={capital}
            />

            {/* Leverage Slider */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <p className="text-center text-gray-400 mb-4">Leverage Power</p>
              <div className="space-y-4">
                <Slider
                  value={leverage}
                  onValueChange={setLeverage}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">1x</span>
                  <span className="text-2xl font-bold text-yellow-400">{leverage[0]}x</span>
                  <span className="text-sm text-gray-500">50x</span>
                </div>
                <p className="text-center text-sm text-gray-500">
                  Commands: {formatCurrency(tradeAmount * leverage[0])}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {!position ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleTrade('up')}
                disabled={tradeAmount <= 0 || tradeAmount > capital}
                className="h-16 text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp className="mr-2 h-6 w-6" />
                THRUST UP
              </Button>
              <Button
                onClick={() => handleTrade('down')}
                disabled={tradeAmount <= 0 || tradeAmount > capital}
                className="h-16 text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingDown className="mr-2 h-6 w-6" />
                THRUST DOWN
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleTrade(position)}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105"
            >
              <DollarSign className="mr-2 h-6 w-6" />
              EXIT POSITION
            </Button>
          )}
        </div>

        {/* Position Info */}
        {position && (
          <div className={`bg-gradient-to-r ${
            position === 'up' 
              ? 'from-green-900/20 to-green-800/20 border-green-600/30' 
              : 'from-red-900/20 to-red-800/20 border-red-600/30'
          } rounded-2xl p-4 border`}>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Entry Price</p>
              <p className={`text-xl font-bold ${position === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(entryPrice)}
              </p>
            </div>
          </div>
        )}

        {/* Flash Mode Button */}
        <Button
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
          variant="outline"
        >
          <Zap className="mr-2 h-4 w-4" />
          Flash Mode - 2x Power (15s) - $0.10
        </Button>
      </div>
    </div>
  );
};

export default TradingArena;
