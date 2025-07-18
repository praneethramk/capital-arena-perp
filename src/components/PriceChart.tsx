
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  currentPrice: number;
}

const PriceChart = ({ currentPrice }: PriceChartProps) => {
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([]);

  useEffect(() => {
    // Initialize with some historical data
    const now = Date.now();
    const initialData = Array.from({ length: 50 }, (_, i) => ({
      time: new Date(now - (49 - i) * 2000).toLocaleTimeString(),
      price: 50000 + Math.sin(i * 0.3) * 1000 + (Math.random() - 0.5) * 500
    }));
    setChartData(initialData);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString(),
          price: currentPrice
        }];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={['dataMin - 200', 'dataMax + 200']} 
              hide 
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#fbbf24" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#fbbf24', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
