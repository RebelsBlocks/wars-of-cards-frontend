declare module '@ref-finance/ref-sdk' {
  export function init_env(network: string, rpcUrl: string): void;
  
  export function getPool(poolId: number): Promise<any>;
  
  export function estimateSwap(params: {
    pool_id: number;
    token_in: string;
    token_out: string;
    amount_in: string;
    pool: any;
  }): Promise<string>;
  
  export function ftGetTokenMetadata(tokenId: string): Promise<{
    decimals: number;
    icon: string | null;
    name: string;
    reference: string | null;
    reference_hash: string | null;
    spec: string;
    symbol: string;
  }>;
} 