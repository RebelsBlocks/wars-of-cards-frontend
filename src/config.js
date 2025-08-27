// Network configuration - can be overridden by environment variable
const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID || 'mainnet';

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

// Contract configuration
const CONTRACT_INFO = {
  mainnet: {
    refFinance: 'v2.ref-finance.near',
    chat: 'chat.near', // placeholder for mainnet
  },
  testnet: {
    refFinance: 'v2.ref-finance.testnet',
    chat: 'chatty.testnet',
  }
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
  nodeUrl: NEAR_CONFIG.nodeUrl,
  // Set a custom contract ID if needed
  contractId: CONTRACT_INFO[NETWORK_ID].refFinance
};

// OpenAI Configuration
const OPENAI_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini', // Nano model - najtańszy i najszybszy
  maxTokens: 500,
  temperature: 0.7,
  topP: 0.9,
};

// Centralized exports with consistent RPC
const CONFIG = {
  NETWORK_ID,
  NetworkId: NETWORK_ID, // For backward compatibility
  EVM_WALLET_CHAIN: EVM_WALLET_CHAINS[NETWORK_ID],
  NEAR_CONFIG,
  REF_SDK_CONFIG,
  OPENAI_CONFIG,
  REF_EXCHANGE_CONTRACT_ID: CONTRACT_INFO[NETWORK_ID].refFinance,
  CHAT_CONTRACT_ID: CONTRACT_INFO[NETWORK_ID].chat,
  
  // Use network-specific RPC
  RPC_URL: NEAR_CONFIG.nodeUrl
};

// Export for both default and named imports
export const NetworkId = NETWORK_ID;
export const NEAR_RPC_URL = NEAR_CONFIG.nodeUrl;
export const CHAT_CONTRACT_ID = CONTRACT_INFO[NETWORK_ID].chat;

export default CONFIG;
