
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

const WalletConnect = () => {
  const handleConnect = () => {
    // TODO: Implement wallet connection logic
    console.log('Connect wallet clicked');
  };

  return (
    <Button 
      onClick={handleConnect}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg transition-all duration-200"
      size="sm"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
};

export default WalletConnect;
