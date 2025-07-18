
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Grid } from 'recharts';

interface PriceChartProps {
  currentPrice: number;
}

const PriceChart = ({ currentPrice }: PriceChartProps) => {
  const [chartData, setChartData] = useState<Array<{ time: string; price: number; volume: number }>>([]);

  useEffect(() => {
    // Initialize with more historical data for better visualization
    const now = Date.now();
    const initialData = Array.from({ length: 100 }, (_, i) => ({
      time: new Date(now - (99 - i) * 3000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      price: 50000 + Math.sin(i * 0.1) * 2000 + (Math.random() - 0.5) * 800,
      volume: Math.random() * 1000000 + 500000
    }));
    setChartData(initialData);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          price: currentPrice,
          volume: Math.random() * 1000000 + 500000
        }];
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 backdrop-blur-sm p-3 rounded-lg border border-gray-600 shadow-lg">
          <p className="text-gray-300 text-sm">{label}</p>
          <p className="text-yellow-400 font-bold">
            Price: ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-blue-400 text-sm">
            Volume: ${(payload[0].payload.volume / 1000000).toFixed(2)}M
          </p>
        </div>
      );
    }
    return null;
  };

  const formatPrice = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const minPrice = Math.min(...chartData.map(d => d.price)) - 500;
  const maxPrice = Math.max(...chartData.map(d => d.price)) + 500;

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-300">Live Market Chart</h3>
        <div className="flex space-x-4 text-sm">
          <span className="text-green-400">● Live</span>
          <span className="text-gray-400">Real-time updates</span>
        </div>
      </div>
      
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickFormatter={formatPrice}
              width={60}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#fbbf24" 
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 6, 
                stroke: '#fbbf24', 
                strokeWidth: 2,
                fill: '#1f2937'
              }}
              fill="url(#priceGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Controls */}
      <div className="flex justify-center space-x-2 mt-4">
        <button className="px-3 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded-lg border border-yellow-600/30">
          1M
        </button>
        <button className="px-3 py-1 text-xs bg-gray-700/50 text-gray-400 rounded-lg border border-gray-600">
          5M
        </button>
        <button className="px-3 py-1 text-xs bg-gray-700/50 text-gray-400 rounded-lg border border-gray-600">
          15M
        </button>
        <button className="px-3 py-1 text-xs bg-gray-700/50 text-gray-400 rounded-lg border border-gray-600">
          1H
        </button>
      </div>
    </div>
  );
};

export default PriceChart;
