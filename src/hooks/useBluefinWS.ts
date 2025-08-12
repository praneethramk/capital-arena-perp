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
  // Shape based on Bluefin docs; we defensively pick price-like fields
  lastPrice?: number;
  indexPrice?: number;
  markPrice?: number;
  currentPrice?: number;
  [key: string]: any;
}

export function useBluefinWS({ symbol }: UseBluefinWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

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

  return { connected, currentPrice, lastEventAt };
}
