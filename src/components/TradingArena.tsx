
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import PriceChart from './PriceChart';
import AmountInput from './AmountInput';
import CapitalDisplay from './CapitalDisplay';
import WalletConnect from './WalletConnect';

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
      setCapital(prev => prev + pnl);
      setPosition(null);
      setPnl(0);
      setCapitalInMarket(0);
      setEntryPrice(0);
    } else {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Flash PnL Animation */}
      {flashPnl && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold z-50 animate-scale-in ${
          flashPnl.type === 'profit' ? 'text-green-400' : 'text-red-400'
        }`}>
          {flashPnl.type === 'profit' ? '🔥' : '💥'} {flashPnl.amount > 0 ? '+' : ''}{formatCurrency(flashPnl.amount)}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center py-8 px-6 border-b border-gray-800">
        <div className="text-center flex-1">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            SUDO THRUST
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Command the Market</p>
        </div>
        <div className="absolute top-8 right-6">
          <WalletConnect />
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6 p-6 min-h-[calc(100vh-140px)]">
        {/* Left Panel - Market Stats and Recent Trades */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Market Stats */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 space-y-4">
            <h3 className="text-lg font-bold text-center text-gray-300">Market Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Volume 24h</span>
                <span className="text-white font-bold">$2.4B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="text-white font-bold">$980B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility</span>
                <span className="text-yellow-400 font-bold">High</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fear & Greed</span>
                <span className="text-orange-400 font-bold">72 (Greed)</span>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-bold text-center text-gray-300 mb-4">Recent Thrusts</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-green-400">↗ UP</span>
                <span className="text-gray-400">$50,120</span>
                <span className="text-green-400">+$245</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400">↙ DOWN</span>
                <span className="text-gray-400">$49,980</span>
                <span className="text-red-400">-$89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400">↗ UP</span>
                <span className="text-gray-400">$49,850</span>
                <span className="text-green-400">+$156</span>
              </div>
            </div>
          </div>

          {/* Available Capital */}
          <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-2xl p-6 border border-yellow-600/30">
            <div className="text-center">
              <p className="text-yellow-400 text-sm mb-2">Available Capital</p>
              <p className="text-2xl font-bold text-yellow-300">{formatCurrency(capital)}</p>
            </div>
          </div>
        </div>

        {/* Center Panel - Price Chart */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Market Price Header */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">BTC/USD</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(marketPrice)}</p>
              <div className="flex justify-center items-center mt-2 space-x-4">
                <span className="text-green-400 text-sm">24h High: $55,000</span>
                <span className="text-red-400 text-sm">24h Low: $45,000</span>
              </div>
            </div>
          </div>

          {/* Enhanced Price Chart */}
          <div className="h-96">
            <PriceChart currentPrice={marketPrice} />
          </div>
        </div>

        {/* Right Panel - Trading Controls and Action Buttons */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Capital Display */}
          <CapitalDisplay 
            amount={tradeAmount}
            leverage={leverage[0]}
            position={position}
            pnl={pnl}
          />

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

          {/* Position Info */}
          {position && (
            <div className={`bg-gradient-to-r ${
              position === 'up' 
                ? 'from-green-900/20 to-green-800/20 border-green-600/30' 
                : 'from-red-900/20 to-red-800/20 border-red-600/30'
            } rounded-2xl p-6 border`}>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Entry Price</p>
                <p className={`text-2xl font-bold ${position === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(entryPrice)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {!position ? (
              <>
                <Button
                  onClick={() => handleTrade('up')}
                  disabled={tradeAmount <= 0 || tradeAmount > capital}
                  className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="mr-3 h-8 w-8" />
                  THRUST UP
                </Button>
                <Button
                  onClick={() => handleTrade('down')}
                  disabled={tradeAmount <= 0 || tradeAmount > capital}
                  className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingDown className="mr-3 h-8 w-8" />
                  THRUST DOWN
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleTrade(position)}
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105"
              >
                <DollarSign className="mr-3 h-8 w-8" />
                EXIT POSITION
              </Button>
            )}
          </div>

          {/* Flash Mode Button */}
          <Button
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
            variant="outline"
          >
            <Zap className="mr-2 h-5 w-5" />
            Flash Mode - 2x Power (15s) - $0.10
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradingArena;
