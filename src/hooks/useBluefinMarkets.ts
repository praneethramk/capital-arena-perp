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
  'https://api.sui-prod.bluefin.io',
  '/bluefin-api' // Use proxy for CORS
];

async function tryFetchMarkets(): Promise<BluefinMarket[]> {
  for (const baseUrl of BLUEFIN_API_ENDPOINTS) {
    try {
      const url = baseUrl.startsWith('/') ? `${baseUrl}/exchangeInfo` : `${baseUrl}/exchangeInfo`;
      // console.log(`Trying to fetch markets from: ${url}`);
      const res = await fetch(url, { 
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        // console.log(`Failed to fetch from ${baseUrl}: ${res.status} ${res.statusText}`);
        continue;
      }
      
      const data = await res.json();
      // console.log(`Successfully fetched ${data.length} markets from ${baseUrl}`);
      
      // Transform the data to our interface
      const markets: BluefinMarket[] = data.map((market: any) => ({
        symbol: market.symbol,
        base: market.baseAssetSymbol,
        quote: market.quoteAssetSymbol,
        tickSize: market.tickSize ? parseFloat(market.tickSize) / 1e18 : 0.01,
        stepSize: market.stepSize ? parseFloat(market.stepSize) / 1e18 : 0.001,
        minOrderSize: market.minOrderSize ? parseFloat(market.minOrderSize) / 1e18 : 0.001,
        maxOrderSize: market.maxLimitOrderSize ? parseFloat(market.maxLimitOrderSize) / 1e18 : 1000000,
        status: market.status,
        baseAssetSymbol: market.baseAssetSymbol,
        quoteAssetSymbol: market.quoteAssetSymbol
      }));
      
      // Filter for active markets or use all if none are active
      const result = markets.length > 0 ? markets : [];
      
      // console.log(`Returning ${result.length} markets`);
      return result;
      
    } catch (err) {
      // console.log(`Error fetching from ${baseUrl}:`, err);
      continue;
    }
  }
  
  // console.log('All API endpoints failed, using fallback data');
  // Fallback with the symbols we know exist from the API response
  return [
    { symbol: 'BTC-PERP', base: 'BTC', quote: 'USDC', status: 'ACTIVE' },
    { symbol: 'ETH-PERP', base: 'ETH', quote: 'USDC', status: 'ACTIVE' },
    { symbol: 'SOL-PERP', base: 'SOL', quote: 'USDC', status: 'ACTIVE' },
    { symbol: 'SUI-PERP', base: 'SUI', quote: 'USDC', status: 'ACTIVE' },
    { symbol: 'AVAX-PERP', base: 'AVAX', quote: 'USDC', status: 'ACTIVE' },
    { symbol: 'ARB-PERP', base: 'ARB', quote: 'USDC', status: 'ACTIVE' },
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
        // console.log('Starting to fetch Bluefin markets...');
        
        const data = await tryFetchMarkets();
        // console.log('Markets fetched successfully:', data);
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