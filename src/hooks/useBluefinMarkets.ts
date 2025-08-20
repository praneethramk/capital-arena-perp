import { useEffect, useState } from 'react';

export interface BluefinMarket {
  symbol: string; // e.g., ETH-PERP
  base?: string;
  quote?: string;
  tickSize?: number;
  stepSize?: number;
  minOrderSize?: number;
  maxOrderSize?: number;
  status?: string;
  baseAssetSymbol?: string;
  quoteAssetSymbol?: string;
}

// Working Bluefin API endpoints
const BLUEFIN_API_ENDPOINTS = [
  'https://dapi.api.sui-prod.bluefin.io',
  'https://api.sui-prod.bluefin.io'
];

async function tryFetchMarkets(): Promise<BluefinMarket[]> {
  for (const baseUrl of BLUEFIN_API_ENDPOINTS) {
    try {
      console.log(`Trying to fetch markets from: ${baseUrl}/exchangeInfo`);
      const res = await fetch(`${baseUrl}/exchangeInfo`, { 
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        console.log(`Failed to fetch from ${baseUrl}: ${res.status} ${res.statusText}`);
        continue;
      }
      
      const data = await res.json();
      console.log(`Successfully fetched ${data.length} markets from ${baseUrl}`);
      
      // Transform the data to our interface
      const markets: BluefinMarket[] = data.map((market: any) => ({
        symbol: market.symbol,
        base: market.baseAssetSymbol,
        quote: market.quoteAssetSymbol,
        tickSize: parseFloat(market.tickSize) / 1e18,
        stepSize: parseFloat(market.stepSize) / 1e18,
        minOrderSize: parseFloat(market.minOrderSize) / 1e18,
        maxOrderSize: parseFloat(market.maxLimitOrderSize) / 1e18,
        status: market.status,
        baseAssetSymbol: market.baseAssetSymbol,
        quoteAssetSymbol: market.quoteAssetSymbol
      }));
      
      // Filter for active markets or use all if none are active
      const activeMarkets = markets.filter(m => m.status === 'ACTIVE');
      const result = activeMarkets.length > 0 ? activeMarkets : markets;
      
      console.log(`Returning ${result.length} markets (${activeMarkets.length} active)`);
      return result;
      
    } catch (err) {
      console.log(`Error fetching from ${baseUrl}:`, err);
      continue;
    }
  }
  
  console.log('All API endpoints failed, using fallback data');
  // Fallback with the symbols we know exist from the API response
  return [
    { symbol: 'BTC-PERP', base: 'BTC', quote: 'USDC', status: 'DELISTED' },
    { symbol: 'ETH-PERP', base: 'ETH', quote: 'USDC', status: 'DELISTED' },
    { symbol: 'SOL-PERP', base: 'SOL', quote: 'USDC', status: 'DELISTED' },
    { symbol: 'SUI-PERP', base: 'SUI', quote: 'USDC', status: 'DELISTED' },
    { symbol: 'AVAX-PERP', base: 'AVAX', quote: 'USDC', status: 'DELISTED' },
    { symbol: 'ARB-PERP', base: 'ARB', quote: 'USDC', status: 'DELISTED' },
  ];
}

export function useBluefinMarkets() {
  const [markets, setMarkets] = useState<BluefinMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        setError(null);
        console.log('Starting to fetch Bluefin markets...');
        
        const data = await tryFetchMarkets();
        console.log('Markets fetched successfully:', data);
        setMarkets(data);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch markets';
        console.error('Error in fetchMarkets:', errorMessage);
        setError(errorMessage);
        
        // Use fallback data on error
        setMarkets([
          { symbol: 'BTC-PERP', base: 'BTC', quote: 'USDC', status: 'DELISTED' },
          { symbol: 'ETH-PERP', base: 'ETH', quote: 'USDC', status: 'DELISTED' },
          { symbol: 'SOL-PERP', base: 'SOL', quote: 'USDC', status: 'DELISTED' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, []);

  return { markets, loading, error };
} 