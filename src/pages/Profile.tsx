import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useNearWallet } from '../contexts/NearWalletContext';
import { useNetwork, getNetworkConfig } from '../contexts/NetworkContext';
import { getChatContractId, chatContract, formatNearAmount, parseNearAmount } from '../utils/chatContract';
import BN from 'bn.js';
import { providers } from 'near-api-js';
import HolographicEffect from '../components/HolographicEffect';

// Helper function to format token amounts with 2 decimal places
function formatTokenAmount(amount: string): string {
  const yoctoToToken = new BN("1000000000000000000000000");
  const amountBN = new BN(amount);
  const wholePart = amountBN.div(yoctoToToken);
  const fractionalPart = amountBN.mod(yoctoToToken);
  
  // Convert fractional part to 2 decimal places
  const fractionalStr = fractionalPart.toString().padStart(24, '0');
  const decimalPlaces = fractionalStr.slice(0, 2);
  
  return `${wholePart}.${decimalPlaces}`;
}

// Add new helper function for wallet name truncation
function truncateWalletName(accountId: string): string {
  if (!accountId.endsWith('.near')) return accountId;
  const name = accountId.slice(0, -5); // remove .near
  if (name.length <= 12) return accountId;
  return `${name.slice(0, 4)}...${name.slice(-4)}.near`;
}

const ProfilePage: NextPage = () => {
  const wallet = useNearWallet();
  const { networkId } = useNetwork();
  const networkConfig = getNetworkConfig(networkId);
  const { accountId, selector, connect, isConnected } = wallet;
  const [balances, setBalances] = useState({ near: "0", crans: "0" });
  
  // Chat Storage State
  const [storageBalance, setStorageBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  
  // Loading state helper
  const isAnyTransactionPending = isDepositing || isWithdrawing;

  const fetchBalances = async () => {
    console.log("Fetching balances for account:", accountId);
    const [nearBalance, cransBalance] = await Promise.all([
      fetchAccountDetails(accountId!),
      fetchCRANSBalance(accountId!)
    ]);
    setBalances({ near: nearBalance, crans: cransBalance });
  };

  async function fetchCRANSBalance(accountId: string) {
    try {
      if (!selector) return "0";
      
      console.log("Fetching CRANS balance from contract:", networkConfig.contracts.crans);
      
      const result = await wallet.viewFunction({
        contractId: networkConfig.contracts.crans,
        methodName: "ft_balance_of",
        args: { account_id: accountId }
      });

      console.log("Raw CRANS token data:", result);

      if (result) {
        return formatTokenAmount(result);
      }
      return "0";
    } catch (error: any) {
      console.error("Error fetching CRANS balance:", error);
      // Return a more user-friendly message
      if (error.message && error.message.includes('Deserialization')) {
        return "Contract Error";
      }
      return "N/A";
    }
  }

  async function fetchAccountDetails(accountId: string) {
    try {
      if (!selector) return "0";
      
      const provider = new providers.JsonRpcProvider({ url: networkConfig.nodeUrl }) as any;
      const account = await provider.query({
        request_type: 'view_account',
        account_id: accountId,
        finality: 'final'
      });

      console.log("Raw account data:", account);
      
      if (account.amount) {
        return formatTokenAmount(account.amount);
      }
      return "0";
    } catch (error) {
      console.error("Error fetching account details:", error);
      return "Error";
    }
  }

  // Load storage balance when wallet connects
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadStorageBalance = async () => {
      if (!accountId || !isConnected || !mounted) {
        setStorageBalance('0');
        return;
      }

      if (isLoadingBalance) {
        return;
      }

      setIsLoadingBalance(true);
      try {
        const balance = await chatContract.getStorageBalance(accountId, wallet);
        if (mounted) {
          setStorageBalance(balance);
        }
      } catch (error) {
        console.error('Error loading storage balance:', error);
        if (mounted) {
          setStorageBalance('0');
        }
      } finally {
        if (mounted) {
          setIsLoadingBalance(false);
        }
      }
    };

    timeoutId = setTimeout(() => {
      if (mounted && accountId && isConnected) {
        loadStorageBalance();
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [accountId, isConnected]);

  useEffect(() => {
    if (accountId && selector) {
      fetchBalances();
    }
  }, [accountId, selector]);

  // Storage management functions
  const refreshStorageBalance = async () => {
    if (!accountId || !isConnected || isLoadingBalance) {
      return;
    }
    
    setIsLoadingBalance(true);
    try {
      const balance = await chatContract.getStorageBalance(accountId, wallet);
      setStorageBalance(balance);
    } catch (error) {
      console.error('Error refreshing storage balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const depositStorage = async (nearAmount: string) => {
    if (!accountId || !isConnected || isDepositing) {
      return;
    }

    try {
      setIsDepositing(true);
      const depositYocto = parseNearAmount(nearAmount);
      const contractId = getChatContractId();
      
      await wallet.executeTransaction({
        contractId,
        methodName: 'deposit_storage',
        args: {},
        gas: '300000000000000',
        deposit: depositYocto,
        callbackUrl: window.location.href
      });

      // Immediate refresh after successful transaction
      await refreshStorageBalance();
      
      // Additional refresh after delay to ensure blockchain state is updated
      setTimeout(() => refreshStorageBalance(), 3000);
    } catch (error) {
      console.error('Error depositing storage:', error);
    } finally {
      setIsDepositing(false);
    }
  };

  const withdrawRemainingStorage = async () => {
    if (!accountId || !isConnected || isWithdrawing) {
      return;
    }

    try {
      setIsWithdrawing(true);
      const contractId = getChatContractId();
      
      await wallet.executeTransaction({
        contractId,
        methodName: 'withdraw_remain_storage',
        args: { amount: null },
        gas: '30000000000000',
        deposit: '0',
        callbackUrl: window.location.href
      });

      // Immediate refresh after successful transaction
      await refreshStorageBalance();
      
      // Additional refresh after delay to ensure blockchain state is updated
      setTimeout(() => refreshStorageBalance(), 3000);
    } catch (error) {
      console.error('Error withdrawing storage:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="card">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {accountId && (
              <HolographicEffect type="glow" className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${accountId}`}
                  alt={accountId}
                  className="w-full h-full object-cover"
                />
              </HolographicEffect>
            )}
            <div>
              <h2 className="text-xl font-semibold holographic-text-strong">
                {accountId ? truncateWalletName(accountId) : 'Profile'}
              </h2>
              {accountId && (
                <a 
                  href={`https://near.social/mob.near/widget/ProfilePage?accountId=${accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm holographic-text-subtle hover:holographic-text transition-all duration-300"
                >
                  View on NEAR Social →
                </a>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {accountId && (
              <button 
                onClick={() => {
                  if (accountId && selector) {
                    fetchBalances();
                    refreshStorageBalance();
                  }
                }}
                className="px-3 py-2 bg-[rgba(237,201,81,0.2)] text-[rgb(237,201,81)] rounded hover:bg-[rgba(237,201,81,0.3)] transition-colors"
                title="Refresh all balances"
              >
                <svg 
                  className="w-4 h-4"
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  viewBox="0 0 24 24"
                >
                  <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
            )}
            {accountId && (
              <button 
                onClick={() => wallet.disconnect()}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Log out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {accountId ? (
          <div className="space-y-6">
            {/* Balances Section */}
            <HolographicEffect type="border" className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4 holographic-text">
                Balances
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <HolographicEffect type="background" className="flex items-center justify-between p-3 rounded">
                  <div>
                    <div className="text-xs text-[rgba(237,201,81,0.6)]">NEAR</div>
                    <div className="text-lg font-bold holographic-text-strong">
                      {balances.near}
                    </div>
                  </div>
                  <div className="text-2xl">Ⓝ</div>
                </HolographicEffect>
                
                <HolographicEffect type="background" className="flex items-center justify-between p-3 rounded">
                  <div>
                    <div className="text-xs text-[rgba(237,201,81,0.6)]">CRANS</div>
                    <div className="text-lg font-bold holographic-text-strong">
                      {balances.crans}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[rgb(237,201,81)]">CRANS</div>
                </HolographicEffect>
                
                <HolographicEffect type="background" className="flex items-center justify-between p-3 rounded">
                  <div>
                    <div className="text-xs text-[rgba(237,201,81,0.6)]">Storage</div>
                    <div className="text-lg font-bold holographic-text-strong">
                      {isLoadingBalance ? '...' : formatNearAmount(storageBalance)}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-[rgb(237,201,81)]">Ⓝ</div>
                </HolographicEffect>
              </div>
            </HolographicEffect>

            {/* Storage Management Section */}
            <HolographicEffect type="border" className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium holographic-text">
                  Chat Storage Management
                </h3>
                <div className="text-xs mt-1 holographic-text-subtle">
                  {getChatContractId()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Deposit Section */}
                <div>
                  <div className="text-xs text-[rgba(237,201,81,0.6)] mb-3">Deposit Storage</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['0.1', '0.3', '0.5', '1'].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => depositStorage(amount)}
                        disabled={isDepositing || isWithdrawing}
                        className="px-3 py-2 bg-[rgb(237,201,81)] text-black font-semibold rounded hover:bg-[rgba(237,201,81,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title={`Deposit ${amount} NEAR for storage`}
                      >
                        {isDepositing ? '⟳' : `${amount} Ⓝ`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Withdraw Section */}
                <div>
                  <div className="text-xs text-[rgba(237,201,81,0.6)] mb-3">Withdraw Storage</div>
                  <button
                    onClick={withdrawRemainingStorage}
                    disabled={isWithdrawing || isDepositing || storageBalance === '0' || parseFloat(formatNearAmount(storageBalance)) === 0}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    title="Withdraw all remaining storage balance"
                  >
                    {isWithdrawing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path d="M12 2v13m0 0l4-4m-4 4l-4-4"/>
                        </svg>
                        Withdraw All Storage
                      </>
                    )}
                  </button>
                </div>
              </div>
            </HolographicEffect>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-6 holographic-text">
              Connect your NEAR wallet to view your profile and balances
            </div>
            <button 
              onClick={connect} 
              className="px-6 py-3 bg-[rgb(237,201,81)] text-black font-semibold rounded-lg hover:bg-[rgba(237,201,81,0.9)] transition-colors flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(237,201,81,0.3)] border border-[rgba(237,201,81,0.4)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

