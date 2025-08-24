
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import PriceChart from './PriceChart';
import AmountInput from './AmountInput';
import CapitalDisplay from './CapitalDisplay';
import WalletConnect from './WalletConnect';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useBluefinWS } from '@/hooks/useBluefinWS';
import { useBluefinMarkets } from '@/hooks/useBluefinMarkets';
import { useBluefinTrading } from '@/hooks/useBluefinTrading';
import { useWallet } from '@/contexts/WalletProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TradingArena = () => {
  
  // Local UI state (kept for compatibility with UI components)
  const [capital, setCapital] = useState(10000);
  const [tradeAmount, setTradeAmount] = useState(1000);
  const [leverage, setLeverage] = useState([10]);
  const [flashPnl, setFlashPnl] = useState<{ amount: number; type: 'profit' | 'loss' } | null>(null);
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [tradingError, setTradingError] = useState<string | null>(null);
  const [tradingSuccess, setTradingSuccess] = useState<string | null>(null);

  // Get markets and real-time data
  const { markets, loading: marketsLoading, error: marketsError } = useBluefinMarkets();
  const { connected: walletConnected, balance: walletBalance, walletType } = useWallet();
  const [symbol, setSymbol] = useState<string>('ETH-PERP');
  
  // Real trading integration
  const {
    isInitialized: tradingInitialized,
    balance: tradingBalance,
    positions,
    isLoading: tradingLoading,
    error: tradingClientError,
    placeTrade,
    closePosition,
    refreshBalance: refreshTradingBalance,
    refreshPositions,
  } = useBluefinTrading();
  
  // Get the current position for this symbol
  const currentPosition = positions.find(p => p.symbol === symbol);
  
  // Legacy state mapping (for UI compatibility)
  const position = currentPosition ? (currentPosition.side === 'LONG' ? 'up' : 'down') : null;
  const pnl = currentPosition ? currentPosition.unrealizedPnl : 0;
  const entryPrice = currentPosition ? currentPosition.entryPrice : 0;
  const capitalInMarket = currentPosition ? currentPosition.notionalValue : 0;
  
  // Debug logging for markets
  useEffect(() => {
    // console.log('📊 Markets loaded:', { markets, loading: marketsLoading, error: marketsError });
  }, [markets, marketsLoading, marketsError]);
  
  useEffect(() => {
    if (markets.length && !markets.some((m) => m.symbol === symbol)) {
      // console.log('🔄 Setting symbol to first available market:', markets[0].symbol);
      setSymbol(markets[0].symbol);
    }
  }, [markets, symbol]);

  // Get real-time WebSocket data for current symbol
  const { 
    connected, 
    currentPrice: livePrice, 
    marketData, 
    recentTrades, 
    candles1m,
    connectionError,
    reconnect 
  } = useBluefinWS({ symbol });
  
  // Debug logging for WebSocket data
  useEffect(() => {
    // console.log('📡 WebSocket data for', symbol, ':', { 
    //   connected, 
    //   livePrice, 
    //   marketDataFields: marketData ? Object.keys(marketData) : [],
    //   tradesCount: recentTrades.length,
    //   candlesCount: candles1m.length,
    //   connectionError 
    // });
  }, [symbol, connected, livePrice, marketData, recentTrades, candles1m, connectionError]);
  
  // Use live price as the primary market price for trading
  const marketPrice = livePrice;
  
  // Update trading logic when live price changes
  useEffect(() => {
    if (typeof livePrice === 'number' && !isNaN(livePrice) && livePrice > 0) {
      // console.log('💰 Live price update for', symbol, ':', livePrice);
    }
  }, [livePrice, symbol]);

  // Calculate PnL flash animation when real PnL changes
  useEffect(() => {
    if (currentPosition && typeof marketPrice === 'number' && marketPrice > 0) {
      const newPnl = currentPosition.unrealizedPnl;
      
      // Check if PnL changed significantly (more than $10)
      if (Math.abs(newPnl - (currentPosition.unrealizedPnl || 0)) > 10) {
        const change = newPnl - (currentPosition.unrealizedPnl || 0);
        setFlashPnl({
          amount: change,
          type: change > 0 ? 'profit' : 'loss'
        });
        
        setTimeout(() => setFlashPnl(null), 2000);
      }
    }
  }, [currentPosition, marketPrice]);

  // Clear messages after timeout
  useEffect(() => {
    if (tradingError) {
      const timer = setTimeout(() => setTradingError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [tradingError]);

  useEffect(() => {
    if (tradingSuccess) {
      const timer = setTimeout(() => setTradingSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [tradingSuccess]);

  // Real trading function
  const handleTrade = async (direction: 'up' | 'down') => {
    if (!walletConnected) {
      setTradingError('Please connect your wallet first');
      return;
    }

    if (!tradingInitialized) {
      setTradingError('Trading client not initialized. Please wait...');
      return;
    }

    if (!marketPrice || marketPrice <= 0) {
      setTradingError('Market price not available');
      return;
    }

    try {
      setTradingError(null);
      setTradingSuccess(null);

      if (currentPosition) {
        // Close existing position
        // console.log('Closing position for', symbol);
        await closePosition(symbol);
        setTradingSuccess(`Position closed for ${symbol}`);
      } else {
        // Open new position
        const side = direction === 'up' ? 'BUY' : 'SELL';
        const leveragedSize = tradeAmount * leverage[0] / marketPrice; // Calculate size based on notional value
        
        // console.log('Placing trade:', {
        //   symbol,
        //   side,
        //   size: leveragedSize,
        //   leverage: leverage[0],
        //   price: marketPrice
        // });

        await placeTrade({
          symbol,
          side,
          size: leveragedSize,
          leverage: leverage[0],
          orderType: 'MARKET'
        }, marketPrice);
        
        setTradingSuccess(`${direction === 'up' ? 'Long' : 'Short'} position opened for ${symbol}`);
      }
      
      // Refresh wallet balance after trade
      setTimeout(() => {
        refreshTradingBalance();
      }, 2000);
      
    } catch (error) {
      console.error('Trade execution failed:', error);
      setTradingError(error instanceof Error ? error.message : 'Trade execution failed');
    }
  };

  const handleSymbolChange = (newSymbol: string) => {
    // console.log('🔄 Changing market from', symbol, 'to', newSymbol);
    setSymbol(newSymbol);
    // Clear any error/success messages when changing symbols
    setTradingError(null);
    setTradingSuccess(null);
    // Note: positions are per symbol, so no need to reset like in demo mode
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  const formatCompact = (val?: number | null) => {
    if (typeof val !== 'number' || isNaN(val)) return '—';
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(val);
  };

  const formatPrice = (price: number, decimals = 2) => {
    if (price < 1) return price.toFixed(8);
    if (price < 100) return price.toFixed(4);
    return price.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white w-full">
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
          <p className="text-gray-400 mt-2 text-lg">Command the Market • Bluefin Integration</p>
          
          {/* Live Data Status */}
          <div className="mt-3 flex justify-center items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`}></div>
            <span className={`text-xs ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
              {connected ? 'LIVE BLUEFIN DATA' : 'DEMO MODE'}
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-500 text-xs">{recentTrades.length} trades • {candles1m.length} candles</span>
            {tradingInitialized && (
              <>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-green-400 text-xs">TRADING READY</span>
              </>
            )}
          </div>
        </div>
        <div className="absolute top-8 right-6">
          <WalletConnect />
        </div>
      </div>

      {/* Trading Status Messages */}
      {(tradingError || tradingSuccess || tradingClientError) && (
        <div className="px-6 pt-4">
          {tradingError && (
            <Alert className="border-red-600/30 bg-red-900/20 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {tradingError}
              </AlertDescription>
            </Alert>
          )}
          {tradingSuccess && (
            <Alert className="border-green-600/30 bg-green-900/20 mb-4">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                {tradingSuccess}
              </AlertDescription>
            </Alert>
          )}
          {tradingClientError && (
            <Alert className="border-orange-600/30 bg-orange-900/20 mb-4">
              <XCircle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-400">
                Trading Client Error: {tradingClientError}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6 p-6 min-h-[calc(100vh-140px)]">
        {/* Left Panel - Available Capital, Market Stats and Recent Trades */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Available Capital */}
          <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-2xl p-6 border border-yellow-600/30">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-yellow-400 text-sm">Balance</p>
              <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-yellow-600/40 text-yellow-300">
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Balance</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <label className="text-sm text-gray-400">Amount (USD)</label>
                    <Input
                      type="number"
                      min={0}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.currentTarget.value))}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setCapital((prev) => prev + (isNaN(depositAmount) ? 0 : depositAmount)); setIsAddBalanceOpen(false); }}>
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-300">{formatCurrency(capital)}</p>
            </div>
          </div>

          {/* Market Selector */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <label className="block text-sm text-gray-400 mb-2">Select Market</label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-200"
              value={symbol}
              onChange={(e) => handleSymbolChange(e.currentTarget.value)}
            >
              {markets.map((m) => (
                <option key={m.symbol} value={m.symbol}>
                  {m.symbol} {m.base && `(${m.base})`}
                </option>
              ))}
            </select>
            {marketsError && (
              <p className="text-xs text-orange-400 mt-1">{marketsError}</p>
            )}
          </div>

          {/* Live Market Stats */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 space-y-4">
            <h3 className="text-lg font-bold text-center text-gray-300">Live Market Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Live Price</span>
                <span className="text-white font-bold">
                  {typeof marketPrice === 'number' ? `$${formatPrice(marketPrice)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mark Price</span>
                <span className="text-white font-bold">
                  {typeof marketData?.markPrice === 'number' ? `$${formatPrice(marketData.markPrice)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Index Price</span>
                <span className="text-white font-bold">
                  {typeof marketData?.indexPrice === 'number' ? `$${formatPrice(marketData.indexPrice)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h High</span>
                <span className="text-white font-bold">
                  {typeof marketData?.high24h === 'number' ? `$${formatPrice(marketData.high24h)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h Low</span>
                <span className="text-white font-bold">
                  {typeof marketData?.low24h === 'number' ? `$${formatPrice(marketData.low24h)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume 24h</span>
                <span className="text-white font-bold">{formatCompact(marketData?.volume24h)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Change 24h</span>
                <span className={`font-bold ${(marketData?.changePercent24h ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {typeof marketData?.changePercent24h === 'number' ? `${marketData.changePercent24h.toFixed(2)}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Recent Trades */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-bold text-center text-gray-300 mb-4">Live Trades</h3>
            <div className="space-y-2 text-xs max-h-64 overflow-auto">
              {recentTrades.length === 0 ? (
                <p className="text-center text-gray-500">Loading trades...</p>
              ) : (
                recentTrades.slice(0, 20).map((trade, idx) => {
                  const isBuy = (trade.side ?? '').toLowerCase().includes('buy');
                  const tradeTime = new Date(trade.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  return (
                    <div key={`${trade.timestamp}-${idx}`} className="flex justify-between items-center py-1">
                      <span className={`font-medium ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                        {isBuy ? '↗ BUY' : '↙ SELL'}
                      </span>
                      <span className="text-gray-300 font-mono">${formatPrice(trade.price)}</span>
                      <span className="text-gray-500">{trade.size ? formatCompact(trade.size) : ''}</span>
                      <span className="text-gray-600 text-xs">{tradeTime}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Panel - Price Chart */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Market Price Header with Live Data */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">{symbol}</p>
              <p className="text-4xl font-bold text-white">
                {typeof marketPrice === 'number' ? `$${formatPrice(marketPrice)}` : '—'}
              </p>
              <div className="flex justify-center items-center mt-2 space-x-4">
                <span className={`text-sm ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
                  {connected ? '● Live Data' : '● Simulated'}
                </span>
                <span className="text-gray-400 text-sm">
                  {connected ? 'Real-time from Bluefin' : 'Demo Mode'}
                </span>
                {connectionError && (
                  <button 
                    onClick={reconnect}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                    title={connectionError}
                  >
                    Try Live Data
                  </button>
                )}
              </div>
              {connectionError && (
                <div className="text-xs text-orange-400 mt-1 text-center">
                  {connectionError}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Price Chart with Live Data */}
          <div className="h-[500px] relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0">
              <PriceChart 
                currentPrice={marketPrice} 
                candles1m={candles1m}
              />
            </div>
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
            walletBalance={walletConnected ? walletBalance : undefined}
            walletCurrency={walletType === 'sui' ? 'SUI' : 'SOL'}
          />

          {/* Action Buttons - Now driven by live price */}
          <div className="space-y-4">
            {!position ? (
              <>
                <Button
                  onClick={() => handleTrade('up')}
                  disabled={!walletConnected || !tradingInitialized || tradingLoading || tradeAmount <= 0 || typeof marketPrice !== 'number'}
                  className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="mr-3 h-8 w-8" />
                  {tradingLoading ? 'PROCESSING...' : 'THRUST UP'}
                </Button>
                <Button
                  onClick={() => handleTrade('down')}
                  disabled={!walletConnected || !tradingInitialized || tradingLoading || tradeAmount <= 0 || typeof marketPrice !== 'number'}
                  className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingDown className="mr-3 h-8 w-8" />
                  {tradingLoading ? 'PROCESSING...' : 'THRUST DOWN'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleTrade(position)}
                disabled={!walletConnected || !tradingInitialized || tradingLoading}
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DollarSign className="mr-3 h-8 w-8" />
                {tradingLoading ? 'CLOSING...' : 'EXIT POSITION'}
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

          {/* Position Info - Shows live entry vs current price */}
          {position && (
            <div className={`bg-gradient-to-r ${
              position === 'up' 
                ? 'from-green-900/20 to-green-800/20 border-green-600/30' 
                : 'from-red-900/20 to-red-800/20 border-red-600/30'
            } rounded-2xl p-6 border`}>
              <div className="text-center space-y-2">
                <p className="text-gray-400 text-sm">Entry Price</p>
                <p className={`text-2xl font-bold ${position === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  ${formatPrice(entryPrice)}
                </p>
                <p className="text-gray-400 text-sm">Current Price</p>
                <p className="text-xl font-bold text-white">
                  ${typeof marketPrice === 'number' ? formatPrice(marketPrice) : '—'}
                </p>
                {typeof marketPrice === 'number' && (
                  <p className={`text-sm font-medium ${
                    (position === 'up' ? marketPrice > entryPrice : marketPrice < entryPrice) 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {((marketPrice - entryPrice) / entryPrice * 100).toFixed(2)}% 
                    {position === 'up' ? ' profit' : ' profit'} potential
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingArena;
