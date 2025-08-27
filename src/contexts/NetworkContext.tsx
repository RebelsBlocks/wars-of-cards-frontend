import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NetworkId = 'mainnet';

interface NetworkContextType {
  networkId: NetworkId;
  setNetworkId: (networkId: NetworkId) => void;
  isMainnet: boolean;
  isTestnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkId, setNetworkIdState] = useState<NetworkId>(() => {
    // Always use mainnet
    return 'mainnet';
  });

  const setNetworkId = (newNetworkId: NetworkId) => {
    // No-op since we only support mainnet
  };

  const value = {
    networkId,
    setNetworkId,
    isMainnet: true,
    isTestnet: false,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

// Network configuration helper
export const getNetworkConfig = (networkId: NetworkId) => {
  const CONTRACT_INFO = {
    mainnet: {
      refFinance: 'v2.ref-finance.near',
      chat: 'warsofcards-chat.near',
    }
  };

  return {
    networkId,
    nodeUrl: 'https://free.rpc.fastnear.com',
    walletUrl: 'https://wallet.near.org',
    helperUrl: 'https://helper.mainnet.near.org',
    explorerUrl: 'https://explorer.near.org',
    contracts: CONTRACT_INFO.mainnet,
    chatContractId: CONTRACT_INFO.mainnet.chat,
  };
};
