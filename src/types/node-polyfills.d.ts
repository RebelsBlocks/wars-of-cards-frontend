declare module 'crypto-browserify';
declare module 'stream-browserify';
declare module 'browserify-zlib';
declare module 'stream-http';
declare module 'https-browserify';
declare module 'os-browserify';
declare module 'path-browserify';
declare module 'process/browser';

declare module 'near-api-js' {
  type KeyPairString = string & { __brand: 'KeyPairString' };
  
  export class KeyPair {
    static fromString(encodedKey: string): KeyPair;
    getPublicKey(): { toString(): string };
  }

  export class Account {
    constructor(connection: Near, accountId: string);
    functionCall(params: {
      contractId: string;
      methodName: string;
      args: any;
      gas?: bigint;
      attachedDeposit?: bigint;
    }): Promise<any>;
  }

  export class Near {
    constructor(config: {
      networkId: string;
      keyStore: keyStores.KeyStore;
      nodeUrl: string;
    });
    account(accountId: string): Promise<Account>;
  }

  export namespace keyStores {
    export class KeyStore {
      setKey(networkId: string, accountId: string, keyPair: KeyPair): Promise<void>;
    }
    export class InMemoryKeyStore extends KeyStore {}
  }

  export namespace providers {
    export class JsonRpcProvider {
      constructor(config: { url: string });
    }
  }

  export namespace utils {
    export function format(args: any): string;
  }
}

declare module '@ref-finance/ref-sdk' {
  export function init_env(network: string, rpcUrl: string): void;
  export function estimateSwap(params: {
    pool_id: number;
    token_in: string;
    token_out: string;
    amount_in: string;
    pool: any;
  }): Promise<string>;
  export function getPool(poolId: number): Promise<any>;
} 