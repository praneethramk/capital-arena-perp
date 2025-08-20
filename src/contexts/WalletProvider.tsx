import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export type WalletType = 'sui' | 'phantom' | 'solush';

interface WalletState {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  balance: number;
  walletType: WalletType | null;
  publicKey: string | null;
}

interface WalletContextType extends WalletState {
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  addBalance: (amount: number) => void;
  getWalletIcon: (walletType: WalletType) => string;
  getWalletName: (walletType: WalletType) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Sui client setup
const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Solana connection setup
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com');

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false,
    address: null,
    balance: 0,
    walletType: null,
    publicKey: null,
  });

  const getWalletIcon = (walletType: WalletType): string => {
    switch (walletType) {
      case 'sui':
        return '🔵'; // Sui logo placeholder
      case 'phantom':
        return '👻'; // Phantom logo placeholder
      case 'solush':
        return '💧'; // Solush logo placeholder
      default:
        return '💼';
    }
  };

  const getWalletName = (walletType: WalletType): string => {
    switch (walletType) {
      case 'sui':
        return 'Sui Wallet';
      case 'phantom':
        return 'Phantom';
      case 'solush':
        return 'Solush';
      default:
        return 'Unknown Wallet';
    }
  };

  const connectSuiWallet = async (): Promise<{ address: string; publicKey: string }> => {
    // Check if Sui wallet is available
    if (typeof window !== 'undefined' && (window as any).suiWallet) {
      try {
        const wallet = (window as any).suiWallet;
        const result = await wallet.connect();
        return {
          address: result.accounts[0].address,
          publicKey: result.accounts[0].publicKey,
        };
      } catch (error) {
        console.error('Sui wallet connection failed:', error);
        throw new Error('Failed to connect to Sui wallet');
      }
    } else {
      // Simulate Sui wallet for demo purposes
      console.log('Sui wallet not detected, using demo account');
      return {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        publicKey: 'sui_demo_public_key',
      };
    }
  };

  const connectPhantomWallet = async (): Promise<{ address: string; publicKey: string }> => {
    // Check if Phantom is available
    if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
      try {
        const phantom = (window as any).phantom.solana;
        const response = await phantom.connect();
        return {
          address: response.publicKey.toString(),
          publicKey: response.publicKey.toString(),
        };
      } catch (error) {
        console.error('Phantom wallet connection failed:', error);
        throw new Error('Failed to connect to Phantom wallet');
      }
    } else {
      // Simulate Phantom wallet for demo purposes
      console.log('Phantom wallet not detected, using demo account');
      return {
        address: 'PhantomDemo1234567890abcdef1234567890abcdef',
        publicKey: 'phantom_demo_public_key',
      };
    }
  };

  const connectSolushWallet = async (): Promise<{ address: string; publicKey: string }> => {
    // Check if Solush is available
    if (typeof window !== 'undefined' && (window as any).solush) {
      try {
        const solush = (window as any).solush;
        const result = await solush.connect();
        return {
          address: result.publicKey.toString(),
          publicKey: result.publicKey.toString(),
        };
      } catch (error) {
        console.error('Solush wallet connection failed:', error);
        throw new Error('Failed to connect to Solush wallet');
      }
    } else {
      // Simulate Solush wallet for demo purposes
      console.log('Solush wallet not detected, using demo account');
      return {
        address: 'SolushDemo1234567890abcdef1234567890abcdef',
        publicKey: 'solush_demo_public_key',
      };
    }
  };

  const fetchSuiBalance = async (address: string): Promise<number> => {
    try {
      const balance = await suiClient.getBalance({ owner: address });
      return parseInt(balance.totalBalance) / 1000000000; // Convert from MIST to SUI
    } catch (error) {
      console.error('Failed to fetch Sui balance:', error);
      // Return demo balance
      return 1000 + Math.random() * 5000;
    }
  };

  const fetchSolanaBalance = async (address: string): Promise<number> => {
    try {
      const publicKey = new PublicKey(address);
      const balance = await solanaConnection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to fetch Solana balance:', error);
      // Return demo balance
      return 500 + Math.random() * 2000;
    }
  };

  const connect = async (walletType: WalletType): Promise<void> => {
    setWalletState(prev => ({ ...prev, connecting: true }));

    try {
      let walletInfo: { address: string; publicKey: string };
      let balance: number;

      switch (walletType) {
        case 'sui':
          walletInfo = await connectSuiWallet();
          balance = await fetchSuiBalance(walletInfo.address);
          break;
        case 'phantom':
          walletInfo = await connectPhantomWallet();
          balance = await fetchSolanaBalance(walletInfo.address);
          break;
        case 'solush':
          walletInfo = await connectSolushWallet();
          balance = await fetchSolanaBalance(walletInfo.address);
          break;
        default:
          throw new Error('Unsupported wallet type');
      }

      setWalletState({
        connected: true,
        connecting: false,
        address: walletInfo.address,
        balance: balance,
        walletType: walletType,
        publicKey: walletInfo.publicKey,
      });

      // Store connection info in localStorage
      localStorage.setItem('bluefin_wallet', JSON.stringify({
        walletType,
        address: walletInfo.address,
        publicKey: walletInfo.publicKey,
      }));

    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletState(prev => ({ 
        ...prev, 
        connecting: false,
        connected: false 
      }));
      throw error;
    }
  };

  const disconnect = (): void => {
    setWalletState({
      connected: false,
      connecting: false,
      address: null,
      balance: 0,
      walletType: null,
      publicKey: null,
    });

    // Clear localStorage
    localStorage.removeItem('bluefin_wallet');

    // Disconnect from actual wallets
    if (typeof window !== 'undefined') {
      if ((window as any).phantom?.solana?.disconnect) {
        (window as any).phantom.solana.disconnect();
      }
      if ((window as any).suiWallet?.disconnect) {
        (window as any).suiWallet.disconnect();
      }
      if ((window as any).solush?.disconnect) {
        (window as any).solush.disconnect();
      }
    }
  };

  const refreshBalance = async (): Promise<void> => {
    if (!walletState.connected || !walletState.address || !walletState.walletType) {
      return;
    }

    try {
      let balance: number;

      switch (walletState.walletType) {
        case 'sui':
          balance = await fetchSuiBalance(walletState.address);
          break;
        case 'phantom':
        case 'solush':
          balance = await fetchSolanaBalance(walletState.address);
          break;
        default:
          return;
      }

      setWalletState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const addBalance = (amount: number): void => {
    setWalletState(prev => ({ 
      ...prev, 
      balance: prev.balance + amount 
    }));
  };

  // Auto-reconnect on page load
  useEffect(() => {
    const storedWallet = localStorage.getItem('bluefin_wallet');
    if (storedWallet) {
      try {
        const { walletType, address, publicKey } = JSON.parse(storedWallet);
        setWalletState(prev => ({
          ...prev,
          connected: true,
          address,
          publicKey,
          walletType,
        }));
        
        // Refresh balance
        setTimeout(() => {
          refreshBalance();
        }, 1000);
      } catch (error) {
        console.error('Failed to restore wallet connection:', error);
        localStorage.removeItem('bluefin_wallet');
      }
    }
  }, []);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (walletState.connected) {
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [walletState.connected, walletState.address, walletState.walletType]);

  const contextValue: WalletContextType = {
    ...walletState,
    connect,
    disconnect,
    refreshBalance,
    addBalance,
    getWalletIcon,
    getWalletName,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 