import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export type WalletType = 'sui' | 'phantom' | 'slush';

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

  // Remove dapp-kit hooks that are causing errors
  // We'll handle Sui wallet connection directly through window.suiWallet

  const getWalletIcon = (walletType: WalletType): string => {
    switch (walletType) {
      case 'sui':
        return '🔵'; // Sui logo placeholder
      case 'phantom':
        return '👻'; // Phantom logo placeholder
      case 'slush':
        return '🌊'; // Slush logo placeholder
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
      case 'slush':
        return 'Slush';
      default:
        return 'Unknown Wallet';
    }
  };

  const connectSuiWallet = async (): Promise<{ address: string; publicKey: string }> => {
    // Check if Sui Wallet is available
    if (typeof window !== 'undefined' && (window as any).suiWallet) {
      try {
        const suiWallet = (window as any).suiWallet;
        // console.log('Requesting Sui wallet connection...');
        
        // Request connection
        const response = await suiWallet.requestPermissions({
          permissions: ['viewAccount', 'suggestTransactions']
        });
        
        if (!response || !response.accounts || response.accounts.length === 0) {
          throw new Error('No accounts found or permission denied');
        }
        
        const account = response.accounts[0];
        // console.log('Sui wallet connected successfully:', account.address);
        
        return {
          address: account.address,
          publicKey: account.publicKey || account.address,
        };
      } catch (error) {
        console.error('Sui wallet connection failed:', error);
        if (error instanceof Error) {
          if (error.message.includes('User rejected')) {
            throw new Error('User rejected the connection request');
          }
        }
        throw new Error('Failed to connect to Sui wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      throw new Error('Sui wallet extension not found. Please install a Sui wallet extension.');
    }
  };

  const connectPhantomWallet = async (): Promise<{ address: string; publicKey: string }> => {
    // Check if Phantom is available
    if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
      try {
        const phantom = (window as any).phantom.solana;
        
        // Check if Phantom is already connected
        if (phantom.isConnected) {
          // console.log('Phantom wallet already connected');
          return {
            address: phantom.publicKey.toString(),
            publicKey: phantom.publicKey.toString(),
          };
        }
        
        // Request connection with explicit permissions
        // console.log('Requesting Phantom wallet connection...');
        const response = await phantom.connect({ onlyIfTrusted: false });
        
        if (!response || !response.publicKey) {
          throw new Error('No public key received from Phantom wallet');
        }
        
        // console.log('Phantom wallet connected successfully:', response.publicKey.toString());
        return {
          address: response.publicKey.toString(),
          publicKey: response.publicKey.toString(),
        };
      } catch (error) {
        console.error('Phantom wallet connection failed:', error);
        if (error instanceof Error) {
          if (error.message.includes('User rejected')) {
            throw new Error('User rejected the connection request');
          }
        }
        throw new Error('Failed to connect to Phantom wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      throw new Error('Phantom wallet extension not found. Please install the Phantom browser extension from phantom.app');
    }
  };

  const connectSlushWallet = async (): Promise<{ address: string; publicKey: string }> => {
    // Check if Slush is available
    if (typeof window !== 'undefined' && (window as any).slush) {
      try {
        const slush = (window as any).slush;
        // console.log('Requesting Slush wallet connection...');
        
        // Request connection with Sui network specific parameters
        const result = await slush.connect({
          network: 'mainnet',
          chain: 'sui'
        });
        
        if (!result || !result.accounts || result.accounts.length === 0) {
          throw new Error('No accounts found or permission denied');
        }
        
        const account = result.accounts[0];
        // console.log('Slush wallet connected successfully:', account.address);
        
        return {
          address: account.address,
          publicKey: account.publicKey || account.address,
        };
      } catch (error) {
        console.error('Slush wallet connection failed:', error);
        if (error instanceof Error) {
          if (error.message.includes('User rejected')) {
            throw new Error('User rejected the connection request');
          }
          if (error.message.includes('network')) {
            throw new Error('Slush wallet does not support Sui network');
          }
        }
        throw new Error('Failed to connect to Slush wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      throw new Error('Slush wallet extension not found. Please install the Slush browser extension.');
    }
  };

  const fetchSuiBalance = async (address: string): Promise<number> => {
    try {
      // console.log('Fetching real Sui balance for address:', address);
      const balance = await suiClient.getBalance({ owner: address });
      const suiBalance = parseInt(balance.totalBalance) / 1000000000; // Convert from MIST to SUI
      // console.log('Real Sui balance fetched:', suiBalance);
      return suiBalance;
    } catch (error) {
      console.error('Failed to fetch Sui balance:', error);
      throw new Error('Unable to fetch Sui balance: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchSolanaBalance = async (address: string): Promise<number> => {
    try {
      // console.log('Fetching real Solana balance for address:', address);
      const publicKey = new PublicKey(address);
      const balance = await solanaConnection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      // console.log('Real Solana balance fetched:', solBalance);
      return solBalance;
    } catch (error) {
      console.error('Failed to fetch Solana balance:', error);
      throw new Error('Unable to fetch Solana balance: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        case 'slush':
          walletInfo = await connectSlushWallet();
          balance = await fetchSuiBalance(walletInfo.address);
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

      // console.log(`Successfully connected ${walletType} wallet:`, {
      //   address: walletInfo.address,
      //   balance: balance
      // });

    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletState(prev => ({ 
        ...prev, 
        connecting: false,
        connected: false 
      }));
      // Re-throw the error so the UI can display it
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
        case 'slush':
          balance = await fetchSuiBalance(walletState.address);
          break;
        case 'phantom':
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

  // Note: Real balance updates will happen through actual blockchain transactions
  // This function is maintained for compatibility but should trigger real transactions
  const addBalance = (amount: number): void => {
    // console.warn('addBalance called - In production, this should trigger real wallet transactions');
    // For now, just refresh the balance to get the latest from blockchain
    refreshBalance();
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