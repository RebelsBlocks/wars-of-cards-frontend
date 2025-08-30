import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

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
  // Since we only support mainnet, we can make this completely static
  const value = useMemo(() => ({
    networkId: 'mainnet' as NetworkId,
    setNetworkId: () => {}, // No-op since we only support mainnet
    isMainnet: true,
    isTestnet: false,
  }), []); // Empty dependency array since values never change

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
    contracts: CONTRACT_INFO.mainnet,
    chatContractId: CONTRACT_INFO.mainnet.chat,
  };
};
