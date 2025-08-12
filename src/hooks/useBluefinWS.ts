import { useEffect, useRef, useState } from 'react';

export type BluefinEvent =
  | 'MarketDataUpdate'
  | 'RecentTrades'
  | 'OrderbookUpdate'
  | 'OrderbookDepthUpdate';

interface UseBluefinWSOptions {
  symbol: string; // e.g., "ETH-PERP"
}

interface MarketDataPayload {
  lastPrice?: number;
  indexPrice?: number;
  markPrice?: number;
  currentPrice?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  [key: string]: any;
}

export interface RecentTradeItem {
  price: number;
  size?: number;
  side?: 'buy' | 'sell' | string;
  time: number;
}

export function useBluefinWS({ symbol }: UseBluefinWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [marketData, setMarketData] = useState<MarketDataPayload | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTradeItem[]>([]);

  useEffect(() => {
    // Close any previous connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
    }

    const ws = new WebSocket('wss://notifications.api.sui-prod.bluefin.io/');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      const subMsg = [
        'SUBSCRIBE',
        [
          {
            e: 'globalUpdates',
            p: symbol,
          },
        ],
      ];
      ws.send(JSON.stringify(subMsg));
    };

    ws.onerror = () => setConnected(false);

    ws.onclose = () => setConnected(false);

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        const eventName: BluefinEvent | string | undefined = data?.eventName;

        if (eventName === 'MarketDataUpdate') {
          const payload: MarketDataPayload = data?.data ?? data;
          setMarketData(payload);
          const price =
            (typeof payload.currentPrice === 'number' && payload.currentPrice) ||
            (typeof payload.lastPrice === 'number' && payload.lastPrice) ||
            (typeof payload.markPrice === 'number' && payload.markPrice) ||
            (typeof payload.indexPrice === 'number' && payload.indexPrice) ||
            null;
          if (price) {
            setCurrentPrice(price);
            setLastEventAt(Date.now());
          }
        } else if (eventName === 'RecentTrades') {
          const trades = (data?.data ?? data) as any;
          const list: RecentTradeItem[] = Array.isArray(trades)
            ? trades
                .map((t: any) => ({
                  price: Number(t.price ?? t.p ?? t.lastPrice ?? t.markPrice),
                  size: Number(t.size ?? t.qty ?? t.q ?? t.amount) || undefined,
                  side: (t.side ?? t.S ?? '').toString().toLowerCase(),
                  time: Number(t.time ?? t.T ?? Date.now()),
                }))
                .filter((t: RecentTradeItem) => !isNaN(t.price))
            : [];
          if (list.length) {
            setRecentTrades((prev) => {
              const merged = [...list, ...prev].slice(0, 50);
              return merged;
            });
          }
        } else if (typeof eventName === 'string' && eventName.includes('@kline@')) {
          // Optional: handle candlesticks if emitted
          // const k = data?.data ?? data;
          // You can parse OHLCV here if needed.
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [symbol]);

  return { connected, currentPrice, lastEventAt, marketData, recentTrades };
}
