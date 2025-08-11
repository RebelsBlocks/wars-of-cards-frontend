// Network configuration
const NETWORK_ID = 'mainnet';

// Chains for EVM Wallets 
const EVM_WALLET_CHAINS = {
  mainnet: {
    chainId: 397,
    name: "Near Mainnet",
    explorer: "https://eth-explorer.near.org",
    rpc: "https://eth-rpc.mainnet.near.org",
  },
  testnet: {
    chainId: 398,
    name: "Near Testnet",
    explorer: "https://eth-explorer-testnet.near.org",
    rpc: "https://eth-rpc.testnet.near.org",
  },
};

// NEAR Configuration
const NEAR_CONFIG = {
  networkId: NETWORK_ID,
  nodeUrl: 'https://free.rpc.fastnear.com',
  walletUrl: 'https://wallet.near.org',
  helperUrl: 'https://helper.mainnet.near.org',
  explorerUrl: 'https://explorer.near.org',
  tokenListUrl: 'https://tokens.ref.finance/tokens',
  reffinanceApiUrl: 'https://indexer.ref.finance/graphql',
  reffinanceApiUrl_v1: 'https://api.stats.ref.finance/api/ft-price'
};

// REF-Finance SDK Configuration
const REF_SDK_CONFIG = {
  apiKey: '', // Optional: API key for REF-Finance API (if required)
  networkId: NETWORK_ID,
  nodeUrl: 'https://free.rpc.fastnear.com',
  // Set a custom contract ID if needed
  contractId: 'v2.ref-finance.near'
};

// Contract configuration
const CONTRACT_INFO = {
  mainnet: {
    crans: 'crans.near',
    refFinance: 'v2.ref-finance.near',
  },
  testnet: {
    crans: 'crans.testnet',
    refFinance: 'v2.ref-finance.testnet',
  }
};

// CRANS Token Configuration
const CRANS_TOKEN_CONFIG = {
  contractId: CONTRACT_INFO[NETWORK_ID].crans, 
  decimals: 18,
  icon: '/logo.svg'
};

// Centralized exports with consistent RPC
const CONFIG = {
  NETWORK_ID,
  NetworkId: NETWORK_ID, // For backward compatibility
  EVM_WALLET_CHAIN: EVM_WALLET_CHAINS[NETWORK_ID],
  NEAR_CONFIG,
  REF_SDK_CONFIG,
  CRANS_TOKEN_CONFIG,
  CRANS_CONTRACT_ID: CONTRACT_INFO[NETWORK_ID].crans,
  CRANS_TICKER_SYMBOL: 'CRANS',
  REF_EXCHANGE_CONTRACT_ID: CONTRACT_INFO[NETWORK_ID].refFinance,
  
  // Always use this RPC for NEAR
  RPC_URL: 'https://free.rpc.fastnear.com'
};

// Export for both default and named imports
export const NetworkId = NETWORK_ID;
export const NEAR_RPC_URL = 'https://free.rpc.fastnear.com';

export default CONFIG;