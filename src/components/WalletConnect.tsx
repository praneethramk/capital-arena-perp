
import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';

const WalletConnect = () => {
  return (
    <div className="min-w-[180px]">
      <ConnectButton connectText="Connect Sui Wallet" />
    </div>
  );
};

export default WalletConnect;
