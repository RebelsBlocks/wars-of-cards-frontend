import React, { type ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { providers } from 'near-api-js';
import { setupWalletSelector } from '@near-wallet-selector/core';
import type { Network, WalletSelector, Wallet, Transaction, Action, FunctionCallAction, WalletModuleFactory } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { useNetwork, getNetworkConfig } from './NetworkContext';

// Add wallet selector styles
import '@near-wallet-selector/modal-ui/styles.css';

// Extend Network type to include our custom properties
interface ExtendedNetwork extends Network {
  // Removed cransContractId
}

interface WalletContextType {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accounts: Array<any>;
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  executeTransaction: (transaction: {
    contractId: string;
    methodName: string;
    args: any;
    gas?: string;
    deposit?: string;
    callbackUrl?: string;
    onSuccess?: (result: any) => void;
  }) => Promise<any>;
  executeTransactions: (transactions: {
    contractId: string;
    methodName: string;
    args: any;
    gas?: string;
    deposit?: string;
  }[], options?: {
    callbackUrl?: string;
    onSuccess?: (result: any) => void;
  }) => Promise<any>;
  viewFunction: (params: {
    contractId: string;
    methodName: string;
    args?: any;
  }) => Promise<any>;
}

const defaultContextValue: WalletContextType = {
  selector: null,
  modal: null,
  accounts: [],
  accountId: null,
  isConnected: false,
  isLoading: true,
  error: null,
  connect: async () => {},
  disconnect: async () => {},
  executeTransaction: async () => {},
  executeTransactions: async () => {},
  viewFunction: async () => {},
};

const WalletContext = React.createContext<WalletContextType>(defaultContextValue);

interface Props {
  children: ReactNode;
}

// We'll get network config dynamically from context

// Helper function to detect Firefox browser
const isFirefox = (): boolean => {
  return typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') !== -1;
};

// Helper function to check if error is user cancellation
const isUserCancellation = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || '';
  return (
    errorMessage.includes('user cancelled') ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user closed') ||
    errorMessage.includes('failed to initialize') ||
    errorMessage.includes('canceled') ||
    errorMessage.includes('cancelled the action') ||
    errorMessage.includes('couldn\'t open popup window') ||
    errorMessage.includes('popup window failed') ||
    errorMessage.includes('need to connect to web popup') ||
    errorMessage.includes('closed the window before completing') ||
    // Firefox specific errors
    errorMessage.includes('failed to execute \'postmessage\'') ||
    errorMessage.includes('target origin provided') ||
    errorMessage.includes('does not match the recipient window\'s origin')
  );
};

function NearWalletProviderComponent({ children }: Props) {
  const { networkId } = useNetwork();
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<any>>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [transactionInProgress, setTransactionInProgress] = useState(false);

  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize functions to prevent unnecessary re-renders and improve performance
  const connect = useCallback(async () => {
    if (!modal) return;
    
    try {
      clearError();
      console.log('Opening wallet selector modal');
      
      // Optimized connection flow with reduced timeouts
      await new Promise<void>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout | null = null;
        
        const handleChange = (state: any) => {
          if (state.accounts.length > 0) {
            if (timeoutId) clearTimeout(timeoutId);
            subscription?.unsubscribe();
            modal.off('onHide', handleModalHide);
            resolve();
          }
        };

        const handleModalHide = () => {
          if (timeoutId) clearTimeout(timeoutId);
          subscription?.unsubscribe();
          reject(new Error('User cancelled the action'));
        };

        const subscription = selector?.store.observable.subscribe(handleChange);
        modal.show();
        modal.on('onHide', handleModalHide);
        
        // Reduced timeout for faster feedback
        const timeoutDuration = isFirefox() ? 15000 : 10000; // 15s for Firefox, 10s for others
        timeoutId = setTimeout(() => {
          // Check if the user is actually connected before rejecting
          const state = selector?.store.getState();
          if (state && state.accounts && state.accounts.length > 0) {
            subscription?.unsubscribe();
            modal.off('onHide', handleModalHide);
            resolve();
          } else {
            subscription?.unsubscribe();
            modal.off('onHide', handleModalHide);
            reject(new Error('Connection timeout'));
          }
        }, timeoutDuration);
      });
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      if (!isUserCancellation(err)) {
        setError(err);
      }
    }
  }, [modal, selector, clearError]);

  const disconnect = useCallback(async () => {
    if (!selector) return;
    
    try {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccounts([]);
      setAccountId(null);
      clearError();
    } catch (err: any) {
      console.error('Failed to disconnect wallet:', err);
      if (!isUserCancellation(err)) {
        setError(err);
      }
    }
  }, [selector, clearError]);



  useEffect(() => {
    let isInitializing = false;
    
    const initNear = async () => {
      // Prevent multiple initializations
      if (isInitializing || selector) return;
      isInitializing = true;
      
      try {
        const networkConfig = getNetworkConfig(networkId);
        console.log('Initializing NEAR wallet with network:', networkConfig.networkId);
        
        const extendedNetworkConfig = {
          networkId: networkConfig.networkId,
          nodeUrl: networkConfig.nodeUrl,
          indexerUrl: 'https://api.kitwallet.app'
        } as ExtendedNetwork;
        
        const selector = await setupWalletSelector({
          network: extendedNetworkConfig,
          modules: [
            setupMeteorWallet() as WalletModuleFactory
          ]
        });

        const modal = setupModal(selector, {
          contractId: networkConfig.chatContractId,
          theme: 'dark',
          description: `Please select a wallet to connect to Chat (${networkConfig.networkId})`
        });

        const state = selector.store.getState();
        console.log('Initial wallet state:', state);
        
        const accounts = state.accounts;

        if (accounts.length > 0) {
          console.log('Found existing accounts:', accounts);
          setAccounts(accounts);
          setAccountId(accounts[0].accountId);
        } else {
          console.log('No existing accounts found');
        }

        selector.store.observable.subscribe((newState: any) => {
          console.log('Wallet state changed:', newState);
          if (newState.accounts.length > 0) {
            setAccounts(newState.accounts);
            setAccountId(newState.accounts[0].accountId);
          } else {
            setAccounts([]);
            setAccountId(null);
          }
        });

        setSelector(selector);
        setModal(modal);
        setIsLoading(false);
        clearError();
      } catch (err: any) {
        console.error('Failed to initialize NEAR connection:', err);
        if (!isUserCancellation(err)) {
          setError(err);
        }
        setIsLoading(false);
      } finally {
        isInitializing = false;
      }
    };

    // Reduced delay for faster initialization
    const timeoutId = setTimeout(initNear, 50); // Reduced from 100ms to 50ms
    
    return () => {
      clearTimeout(timeoutId);
      isInitializing = false;
    };
  }, [networkId]); // Usuń clearError dependency żeby nie tworzyć pętli

  const executeTransaction = useCallback(async (transaction: {
    contractId: string;
    methodName: string;
    args: any;
    gas?: string;
    deposit?: string;
    callbackUrl?: string;
    onSuccess?: (result: any) => void;
  }) => {
    if (!selector || !accountId) throw new Error('No wallet connected');
    if (transactionInProgress) throw new Error('Transaction already in progress');

    try {
      clearError();
      setTransactionInProgress(true);
      const wallet = await selector.wallet();
      
      const gas = transaction.gas || "30000000000000";
      const deposit = transaction.deposit || "0";
      
      // Add current URL as callback URL if none provided
      const callbackUrl = transaction.callbackUrl || window.location.href;

      console.log(`Executing transaction: ${transaction.methodName} on ${transaction.contractId}`);
      
      // Reduced timeout for faster feedback
      let timeoutId: NodeJS.Timeout | null = null;
      let hasCompleted = false;
      
      const timeoutDuration = isFirefox() ? 15000 : 10000; // Reduced from 20s to 15s for Firefox, 10s for others
      timeoutId = setTimeout(() => {
        if (!hasCompleted) {
          console.log('Transaction timeout - checking state');
          hasCompleted = true;
        }
      }, timeoutDuration);

      const result = await wallet.signAndSendTransaction({
        receiverId: transaction.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: transaction.methodName,
              args: transaction.args,
              gas,
              deposit,
            },
          }
        ],
        callbackUrl: callbackUrl,
      });

      hasCompleted = true;
      if (timeoutId) clearTimeout(timeoutId);

      if (result && transaction.onSuccess) {
        transaction.onSuccess(result);
      }

      return result;
    } catch (error: any) {
      console.error('Transaction execution error:', error);
      // Special handling for Firefox postMessage errors
      if (isFirefox() && 
          error?.message?.includes('postMessage') && 
          error?.message?.includes('origin')) {
        console.log('Firefox postMessage error - treating as potential success');
        // In Firefox, sometimes we get postMessage errors even when the transaction went through
        // We can notify the user that they should check if their transaction was successful
        if (transaction.onSuccess) {
          transaction.onSuccess({ status: 'unknown', message: 'Please check your transaction status in your wallet.' });
        }
      } else if (!isUserCancellation(error)) {
        setError(error);
      }
      throw error;
    } finally {
      setTransactionInProgress(false);
    }
  }, [selector, accountId, transactionInProgress, clearError]);

  const executeTransactions = useCallback(async (transactions: {
    contractId: string;
    methodName: string;
    args: any;
    gas?: string;
    deposit?: string;
  }[], options?: {
    callbackUrl?: string;
    onSuccess?: (result: any) => void;
  }) => {
    if (!selector || !accountId) throw new Error('No wallet connected');
    if (transactionInProgress) throw new Error('Transaction already in progress');

    try {
      clearError();
      setTransactionInProgress(true);
      const wallet = await selector.wallet();
      
      const formattedTransactions: Transaction[] = transactions.map(tx => ({
        signerId: accountId,
        receiverId: tx.contractId,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: tx.methodName,
            args: tx.args,
            gas: tx.gas || "30000000000000",
            deposit: tx.deposit || "0",
          }
        }] as Action[]
      }));

      // Add current URL as callback URL if none provided
      const callbackUrl = options?.callbackUrl || window.location.href;
      
      console.log(`Executing ${transactions.length} transactions`);
      
      // Reduced timeout for faster feedback
      let timeoutId: NodeJS.Timeout | null = null;
      let hasCompleted = false;
      
      const timeoutDuration = isFirefox() ? 15000 : 10000; // Reduced from 20s to 15s for Firefox, 10s for others
      timeoutId = setTimeout(() => {
        if (!hasCompleted) {
          console.log('Transaction timeout - checking state');
          hasCompleted = true;
        }
      }, timeoutDuration);

      const result = await wallet.signAndSendTransactions({
        transactions: formattedTransactions,
        callbackUrl: callbackUrl,
      });
      
      hasCompleted = true;
      if (timeoutId) clearTimeout(timeoutId);
      
      if (result && options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error: any) {
      console.error('Transactions execution error:', error);
      // Special handling for Firefox postMessage errors
      if (isFirefox() && 
          error?.message?.includes('postMessage') && 
          error?.message?.includes('origin')) {
        console.log('Firefox postMessage error - treating as potential success');
        // In Firefox, sometimes we get postMessage errors even when the transaction went through
        if (options?.onSuccess) {
          options.onSuccess({ status: 'unknown', message: 'Please check your transaction status in your wallet.' });
        }
      } else if (!isUserCancellation(error)) {
        setError(error);
      }
      throw error;
    } finally {
      setTransactionInProgress(false);
    }
  }, [selector, accountId, transactionInProgress, clearError]);

  const viewFunction = useCallback(async (params: {
    contractId: string;
    methodName: string;
    args?: any;
  }) => {
    try {
      clearError();
      const networkConfig = getNetworkConfig(networkId);
      const provider = new providers.JsonRpcProvider({
        url: networkConfig.nodeUrl
      });
      
      const rawResult = await (provider as any).query({
        request_type: 'call_function',
        account_id: params.contractId,
        method_name: params.methodName,
        args_base64: Buffer.from(JSON.stringify(params.args || {})).toString('base64'),
        finality: 'final'
      });

      return JSON.parse(Buffer.from(rawResult.result).toString());
    } catch (error: any) {
      console.error('View function error:', error);
      if (!isUserCancellation(error)) {
        setError(error);
      }
      throw error;
    }
  }, [networkId, clearError]);

  const contextValue = useMemo(() => ({
    selector,
    modal,
    accounts,
    accountId,
    isConnected: !!accountId,
    isLoading,
    error,
    connect,
    disconnect,
    executeTransaction,
    executeTransactions,
    viewFunction,
  }), [
    selector,
    modal,
    accounts,
    accountId,
    isLoading,
    error,
    connect,
    disconnect,
    executeTransaction,
    executeTransactions,
    viewFunction,
  ]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export const NearWalletProvider = NearWalletProviderComponent;

export const useNearWallet = () => {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error('useNearWallet must be used within a NearWalletProvider');
  }
  return context;
}; 
