import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, Maximize2 } from 'lucide-react';

// Define the Candle1m interface locally since it's not exported from the hook
interface Candle1m {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceChartProps {
  currentPrice: number | null;
  candles1m?: Candle1m[];
}

const PriceChart = ({ currentPrice, candles1m = [] }: PriceChartProps) => {
  const [chartData, setChartData] = useState<Array<{ time: string; price: number; volume: number; ma5?: number; ma20?: number }>>([]);
  const [mode, setMode] = useState<'line' | 'area' | 'candles'>('area');
  const [showMA, setShowMA] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  // Calculate moving averages
  const calculateMA = (data: any[], period: number, field: string = 'price') => {
    return data.map((item, index) => {
      if (index < period - 1) return { ...item };
      const slice = data.slice(index - period + 1, index + 1);
      const avg = slice.reduce((sum, d) => sum + d[field], 0) / period;
      return { ...item, [`ma${period}`]: avg };
    });
  };

  // Push live ticks into chart data with technical indicators
  useEffect(() => {
    if (typeof currentPrice === 'number' && !isNaN(currentPrice)) {
      setChartData((prev) => {
        const nowStr = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        
        let newData = [...prev.slice(-199), { time: nowStr, price: currentPrice, volume: Math.random() * 1000 + 500 }];
        
        // Calculate moving averages
        if (newData.length >= 5) {
          newData = calculateMA(newData, 5);
        }
        if (newData.length >= 20) {
          newData = calculateMA(newData, 20);
        }
        
        // Calculate price change
        if (prev.length > 0) {
          const prevPrice = prev[prev.length - 1].price;
          const change = currentPrice - prevPrice;
          const changePercent = (change / prevPrice) * 100;
          setPriceChange(change);
          setPriceChangePercent(changePercent);
        }
        
        return newData;
      });
    }
  }, [currentPrice]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-md p-4 rounded-xl border border-gray-600/50 shadow-2xl">
          <div className="border-b border-gray-700 pb-2 mb-2">
            <p className="text-gray-300 text-sm font-medium">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="text-yellow-400 font-bold text-lg">
              Price: ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </p>
            {data.volume && (
              <p className="text-blue-400 text-sm">
                Volume: {data.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            )}
            {showMA && data.ma5 && (
              <p className="text-green-400 text-sm">
                MA5: ${data.ma5.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </p>
            )}
            {showMA && data.ma20 && (
              <p className="text-purple-400 text-sm">
                MA20: ${data.ma20.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length ? Math.min(...prices) * 0.998 : undefined;
  const maxPrice = prices.length ? Math.max(...prices) * 1.002 : undefined;

  // Enhanced lightweight-charts candlestick rendering
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== 'candles') return;
    let cleanup = () => {};
    (async () => {
      const module = await import('lightweight-charts');
      const { createChart, ColorType } = module as any;
      if (!containerRef.current) return;
      
      const chart = createChart(containerRef.current, {
        layout: { 
          background: { type: ColorType.Solid, color: 'transparent' }, 
          textColor: '#9ca3af',
          fontSize: 12,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        },
        grid: { 
          horzLines: { color: 'rgba(156,163,175,0.1)' }, 
          vertLines: { color: 'rgba(156,163,175,0.1)' } 
        },
        timeScale: { 
          borderColor: 'rgba(75,85,99,0.3)',
          timeVisible: true,
          secondsVisible: false
        },
        rightPriceScale: { 
          borderColor: 'rgba(75,85,99,0.3)',
          scaleMargins: { top: 0.1, bottom: 0.2 }
        },
        crosshair: { 
          mode: 1,
          vertLine: { color: 'rgba(251, 191, 36, 0.5)', width: 1, style: 2 },
          horzLine: { color: 'rgba(251, 191, 36, 0.5)', width: 1, style: 2 }
        },
        autoSize: true,
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });
      
      // Main candlestick series
      const candleSeries = chart.addCandlestickSeries({ 
        upColor: '#10b981', 
        downColor: '#ef4444', 
        borderVisible: false, 
        wickUpColor: '#10b981', 
        wickDownColor: '#ef4444',
        priceFormat: { type: 'price', precision: 6, minMove: 0.000001 }
      });
      
      // Volume series
      const volumeSeries = chart.addHistogramSeries({
        color: 'rgba(156, 163, 175, 0.3)',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        scaleMargins: { top: 0.8, bottom: 0 }
      });
      
      chartRef.current = chart;
      seriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      
      cleanup = () => {
        try { chart.remove(); } catch {}
        chartRef.current = null;
        seriesRef.current = null;
        volumeSeriesRef.current = null;
      };
      
      const candleData = (candles1m || []).map((c) => ({ 
        time: Math.floor(c.time / 1000), 
        open: c.open, 
        high: c.high, 
        low: c.low, 
        close: c.close 
      }));
      
      const volumeData = (candles1m || []).map((c) => ({
        time: Math.floor(c.time / 1000),
        value: c.volume || Math.random() * 1000 + 500,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
      }));
      
      candleSeries.setData(candleData);
      volumeSeries.setData(volumeData);
    })();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode !== 'candles') return;
    const candleSeries = seriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;
    
    const candleData = (candles1m || []).map((c) => ({ 
      time: Math.floor(c.time / 1000), 
      open: c.open, 
      high: c.high, 
      low: c.low, 
      close: c.close 
    }));
    
    const volumeData = (candles1m || []).map((c) => ({
      time: Math.floor(c.time / 1000),
      value: c.volume || Math.random() * 1000 + 500,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    }));
    
    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);
  }, [candles1m, mode]);

  const hasLineData = chartData.length > 0;
  const hasCandleData = (candles1m?.length ?? 0) > 0;
  const isPositive = priceChange >= 0;

  const chartContainerClass = fullscreen 
    ? "fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm p-6"
    : "bg-gradient-to-br from-gray-800/20 via-gray-800/30 to-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 h-full shadow-2xl";

  return (
    <div className={chartContainerClass}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xl font-bold text-gray-200">Live Market Chart</h3>
          </div>
          
          {currentPrice && (
            <div className="flex items-center space-x-3 bg-gray-800/50 rounded-lg px-4 py-2">
              <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-bold">
                  {isPositive ? '+' : ''}{priceChange.toFixed(6)}
                </span>
                <span className="text-sm">
                  ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 text-sm bg-gray-800/50 rounded-lg p-1">
            <button 
              onClick={() => setMode('area')} 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all ${
                mode === 'area' 
                  ? 'bg-yellow-600/30 text-yellow-400 shadow-lg' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Area</span>
            </button>
            <button 
              onClick={() => setMode('line')} 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all ${
                mode === 'line' 
                  ? 'bg-yellow-600/30 text-yellow-400 shadow-lg' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Line</span>
            </button>
            <button 
              onClick={() => setMode('candles')} 
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-all ${
                mode === 'candles' 
                  ? 'bg-yellow-600/30 text-yellow-400 shadow-lg' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Candles</span>
            </button>
          </div>
          
          {mode !== 'candles' && (
            <button
              onClick={() => setShowMA(!showMA)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                showMA 
                  ? 'bg-purple-600/30 text-purple-400 border border-purple-600/30' 
                  : 'bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-600/50'
              }`}
            >
              MA
            </button>
          )}
          
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-600/50 transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {mode === 'line' ? (
        hasLineData ? (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  interval="preserveStartEnd" 
                />
                <YAxis 
                  domain={minPrice && maxPrice ? [minPrice, maxPrice] : ['auto', 'auto']} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  width={80}
                  tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {currentPrice && <ReferenceLine y={currentPrice} stroke="#fbbf24" strokeDasharray="3 3" strokeOpacity={0.7} />}
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#fbbf24" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="ma5" stroke="#10b981" strokeWidth={2} dot={false} strokeOpacity={0.8} />
                    <Line type="monotone" dataKey="ma20" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeOpacity={0.8} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Activity className="w-12 h-12 text-yellow-400 mx-auto" />
              </div>
              <p className="text-gray-400">Waiting for live price data…</p>
            </div>
          </div>
        )
      ) : mode === 'area' ? (
        hasLineData ? (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.6}/>
                    <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  interval="preserveStartEnd" 
                />
                <YAxis 
                  domain={minPrice && maxPrice ? [minPrice, maxPrice] : ['auto', 'auto']} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  width={80}
                  tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                />
                <Tooltip content={<CustomTooltip />} />
                {currentPrice && <ReferenceLine y={currentPrice} stroke="#fbbf24" strokeDasharray="3 3" strokeOpacity={0.7} />}
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="ma5" stroke="#10b981" strokeWidth={2} dot={false} strokeOpacity={0.8} />
                    <Line type="monotone" dataKey="ma20" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeOpacity={0.8} />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Activity className="w-12 h-12 text-yellow-400 mx-auto" />
              </div>
              <p className="text-gray-400">Waiting for live price data…</p>
            </div>
          </div>
        )
      ) : hasCandleData ? (
        <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden" />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <BarChart3 className="w-12 h-12 text-yellow-400 mx-auto" />
            </div>
            <p className="text-gray-400">Waiting for candlestick data…</p>
          </div>
        </div>
      )}
      
      {fullscreen && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setFullscreen(false)}
            className="p-3 rounded-lg bg-gray-800/70 text-gray-300 hover:bg-gray-700/70 transition-all"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
