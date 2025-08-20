
import React, { useState } from 'react';
import { Wallet, Plus, RefreshCw, LogOut, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useWallet, WalletType } from '@/contexts/WalletProvider';

const WalletConnect = () => {
  const {
    connected,
    connecting,
    address,
    balance,
    walletType,
    connect,
    disconnect,
    refreshBalance,
    addBalance,
    getWalletIcon,
    getWalletName,
  } = useWallet();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = async (selectedWalletType: WalletType) => {
    try {
      await connect(selectedWalletType);
      setShowWalletModal(false);
    } catch (error) {
      console.error('Connection failed:', error);
      // Error is already handled in the wallet provider
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddBalance = () => {
    const amount = parseFloat(addBalanceAmount);
    if (amount && amount > 0) {
      addBalance(amount);
      setAddBalanceAmount('');
      setShowAddBalanceModal(false);
    }
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: number) => {
    return bal.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const walletOptions: { type: WalletType; name: string; description: string }[] = [
    { 
      type: 'sui', 
      name: 'Sui Wallet', 
      description: 'Connect with official Sui wallet for native trading' 
    },
    { 
      type: 'phantom', 
      name: 'Phantom', 
      description: 'Popular multi-chain wallet with Solana support' 
    },
    { 
      type: 'solush', 
      name: 'Solush', 
      description: 'Secure Solana wallet with advanced features' 
    },
  ];

  return (
    <div className="flex items-center space-x-3">
      {connected ? (
        <div className="flex items-center space-x-2">
          {/* Balance Display */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getWalletIcon(walletType!)}</span>
                <div>
                  <div className="text-sm font-bold text-yellow-400">
                    {formatBalance(balance)} {walletType === 'sui' ? 'SUI' : 'SOL'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getWalletName(walletType!)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={copyAddress}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{formatAddress(address!)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="bg-blue-600/20 border-blue-600/30 text-blue-400 hover:bg-blue-600/30"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Dialog open={showAddBalanceModal} onOpenChange={setShowAddBalanceModal}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600/20 border-green-600/30 text-green-400 hover:bg-green-600/30"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-gray-200">Add Balance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-yellow-400">
                        Demo mode: This adds virtual balance for testing
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount ({walletType === 'sui' ? 'SUI' : 'SOL'})
                    </label>
                    <Input
                      type="number"
                      value={addBalanceAmount}
                      onChange={(e) => setAddBalanceAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-gray-800 border-gray-600 text-gray-200"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAddBalance}
                      disabled={!addBalanceAmount || parseFloat(addBalanceAmount) <= 0}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Add Balance
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddBalanceModal(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogTrigger asChild>
            <Button
              disabled={connecting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-200 text-xl">Choose Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.type}
                  onClick={() => handleConnect(wallet.type)}
                  disabled={connecting}
                  className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getWalletIcon(wallet.type)}</div>
                    <div className="flex-1">
                      <div className="text-gray-200 font-medium group-hover:text-white transition-colors">
                        {wallet.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {wallet.description}
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-300">
                      →
                    </div>
                  </div>
                </button>
              ))}
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400">
                    Demo wallets will be used if browser extensions aren't detected
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WalletConnect;
