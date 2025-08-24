import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useNearWallet } from '../contexts/NearWalletContext';
import { useNetwork, getNetworkConfig } from '../contexts/NetworkContext';
import { getChatContractId, chatContract, formatNearAmount, parseNearAmount } from '../utils/chatContract';
import BN from 'bn.js';
import { providers } from 'near-api-js';

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

// Helper function to format terra points in a more readable way
function formatTerraPoints(terraAmount: string): string {
  try {
    const amount = new BN(terraAmount);
    if (amount.isZero()) return "0";

    // No need to divide by 10^20 anymore as we're dealing with raw bytes
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch (error) {
    return "0";
  }
}

// Helper function to calculate NEAR from terra points with 4 decimal places
function calculateNearAmount(terraAmount: string): string {
  try {
    // Each byte costs 0.00001 NEAR
    const bytesToNear = new BN("10000000000000000000"); // 0.00001 in yoctoNEAR
    const amountBN = new BN(terraAmount);
    const nearAmount = amountBN.mul(bytesToNear);
    
    const yoctoToNear = new BN("1000000000000000000000000");
    const wholePart = nearAmount.div(yoctoToNear);
    const fractionalPart = nearAmount.mod(yoctoToNear);
    
    // Convert fractional part to 4 decimal places
    const fractionalStr = fractionalPart.toString().padStart(24, '0');
    const decimalPlaces = fractionalStr.slice(0, 4);
    
    return `${wholePart}.${decimalPlaces}`;
  } catch (error) {
    return "0";
  }
}

// Helper function to convert bytes to yoctoNEAR
function bytesToYoctoNEAR(bytes: string): string {
  try {
    const bytesToNear = new BN("10000000000000000000"); // 0.00001 NEAR in yoctoNEAR
    const bytesAmount = new BN(bytes);
    return bytesAmount.mul(bytesToNear).toString();
  } catch (error) {
    return "0";
  }
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
  const [socialStorage, setSocialStorage] = useState<string | null>(null);
  const [isClaimingPoints, setIsClaimingPoints] = useState(false);
  
  // Chat Storage State
  const [storageBalance, setStorageBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  
  // Loading state helper
  const isAnyTransactionPending = isDepositing || isWithdrawing;

  const fetchBalances = async () => {
    console.log("Fetching balances for account:", accountId);
    const [nearBalance, cransBalance, socialStorageBalance] = await Promise.all([
      fetchAccountDetails(accountId!),
      fetchCRANSBalance(accountId!),
      fetchSocialStorageBalance(accountId!)
    ]);
    console.log("Fetched social storage balance:", socialStorageBalance);
    setBalances({ near: nearBalance, crans: cransBalance });
    setSocialStorage(socialStorageBalance);
  };

  async function fetchSocialStorageBalance(accountId: string) {
    try {
      if (!selector) return null;
      
      const result = await wallet.viewFunction({
        contractId: 'social.near',
        methodName: 'get_account_storage',
        args: { account_id: accountId }
      });

      console.log("Social storage data:", result);

      if (result) {
        // We focus on available_bytes as these are the points that can be withdrawn
        const availableBytes = result.available_bytes || 0;
        console.log("Available bytes:", availableBytes);
        return availableBytes.toString();
      }
      return "0";
    } catch (error) {
      console.error("Error fetching social storage data:", error);
      return null;
    }
  }

  async function handleClaimPoints() {
    if (!accountId || !socialStorage || isClaimingPoints) return;
    
    setIsClaimingPoints(true);
    try {
      // Get current available bytes before withdrawal
      const currentStorage = await fetchSocialStorageBalance(accountId);
      if (!currentStorage) {
        throw new Error("Could not fetch current storage balance");
      }

      // Convert bytes to yoctoNEAR for withdrawal
      const withdrawAmount = bytesToYoctoNEAR(currentStorage);
      console.log("Withdrawing amount in yoctoNEAR:", withdrawAmount);

      await wallet.executeTransaction({
        contractId: 'social.near',
        methodName: 'storage_withdraw',
        args: { amount: withdrawAmount },
        gas: '30000000000000',
        deposit: '1',
        callbackUrl: window.location.href
      });

      // Perform 3 refresh attempts with 2-second intervals
      for (let i = 1; i <= 3; i++) {
        setTimeout(async () => {
          console.log(`Refresh attempt ${i}/3`);
          const newSocialBalance = await fetchSocialStorageBalance(accountId);
          setSocialStorage(newSocialBalance);
          
          const newNearBalance = await fetchAccountDetails(accountId);
          setBalances(prev => ({ ...prev, near: newNearBalance }));
        }, i * 2000); // 2000ms = 2 seconds
      }

    } catch (error) {
      console.error("Error claiming points:", error);
    } finally {
      setIsClaimingPoints(false);
    }
  }

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
    <div className="mx-auto max-w-4xl md:max-w-5xl px-3 md:px-4 py-6">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[rgb(237,201,81)]">
            {accountId ? truncateWalletName(accountId) : 'Profile'}
          </h2>
          <div className="flex gap-2">
            {accountId && (
              <button 
                onClick={() => {
                  if (accountId && selector) {
                    setIsClaimingPoints(true);
                    fetchBalances().finally(() => setIsClaimingPoints(false));
                  }
                }}
                disabled={isClaimingPoints}
                className="px-3 py-2 bg-[rgba(237,201,81,0.2)] text-[rgb(237,201,81)] rounded hover:bg-[rgba(237,201,81,0.3)] transition-colors disabled:opacity-50"
                title="Refresh balances"
              >
                <svg 
                  className={`w-5 h-5 ${isClaimingPoints ? 'animate-spin' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                </svg>
              </button>
            )}
            {accountId && (
              <button 
                onClick={() => {
                  wallet.disconnect();
                }}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Log out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {accountId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 border border-[rgba(237,201,81,0.25)]">
              <div className="text-sm text-[rgba(237,201,81,0.7)] mb-2">Profile Picture</div>
              <div className="flex flex-col items-center">
                <img 
                  src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${accountId}`}
                  alt={accountId}
                  className="w-16 h-16 rounded-full border-2 border-[rgb(237,201,81)] mb-3"
                />
                <a 
                  href={`https://near.social/mob.near/widget/ProfilePage?accountId=${accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[rgb(237,201,81)] text-black font-semibold rounded hover:bg-[rgba(237,201,81,0.9)] transition-colors text-sm"
                >
                  View Profile
                </a>
              </div>
            </div>

            {/* Balances */}
            <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 border border-[rgba(237,201,81,0.25)]">
              <div className="text-sm text-[rgba(237,201,81,0.7)] mb-4">Balances</div>
              
              {/* NEAR Balance */}
              <div className="mb-4">
                <div className="text-xs text-[rgba(237,201,81,0.6)] mb-1">NEAR Balance</div>
                <div className="text-lg font-bold text-[rgb(237,201,81)]">{balances.near} Ⓝ</div>
              </div>

              {/* CRANS Balance */}
              <div>
                <div className="text-xs text-[rgba(237,201,81,0.6)] mb-1">CRANS Balance</div>
                <div className="text-lg font-bold text-[rgb(237,201,81)]">{balances.crans} CRANS</div>
              </div>
            </div>

            {/* Chat Storage Management */}
            <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4 border border-[rgba(237,201,81,0.25)]">
              <div className="text-sm text-[rgba(237,201,81,0.7)] mb-2">Chat Storage</div>
              <div className="text-xs text-[rgba(237,201,81,0.5)] mb-4">
                Contract: {getChatContractId()}
              </div>
              
              {/* Storage Balance */}
              <div className="mb-4">
                <div className="text-xs text-[rgba(237,201,81,0.6)] mb-1">Storage Balance</div>
                <div className="text-lg font-bold text-[rgb(237,201,81)] mb-2">
                  {isLoadingBalance ? 'Loading...' : `${formatNearAmount(storageBalance)} NEAR`}
                </div>
                <button
                  onClick={refreshStorageBalance}
                  disabled={isLoadingBalance || isAnyTransactionPending}
                  className="text-xs px-2 py-1 bg-[rgba(237,201,81,0.2)] text-[rgb(237,201,81)] rounded hover:bg-[rgba(237,201,81,0.3)] transition-colors disabled:opacity-50"
                  title="Refresh storage balance"
                >
                  {isLoadingBalance ? '⟳' : '↻'} Refresh
                </button>
              </div>

              {/* Deposit Storage */}
              <div className="mb-4">
                <div className="text-xs text-[rgba(237,201,81,0.6)] mb-2">Deposit Storage</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {['0.1', '0.3', '0.5', '1'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => depositStorage(amount)}
                      disabled={isDepositing || isWithdrawing}
                      className="px-2 py-1 bg-[rgb(237,201,81)] text-black font-semibold rounded hover:bg-[rgba(237,201,81,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      title={`Deposit ${amount} NEAR for storage`}
                    >
                      {isDepositing ? '⟳' : `${amount} Ⓝ`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdraw Storage */}
              <div>
                <div className="text-xs text-[rgba(237,201,81,0.6)] mb-2">Withdraw Storage</div>
                <button
                  onClick={withdrawRemainingStorage}
                  disabled={isWithdrawing || isDepositing || storageBalance === '0' || parseFloat(formatNearAmount(storageBalance)) === 0}
                  className="w-full px-3 py-2 bg-orange-600 text-white font-semibold rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Withdraw all remaining storage balance"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw All'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-[rgba(237,201,81,0.8)] mb-4">
              Connect your NEAR wallet to view your profile and balances
            </div>
            <button onClick={connect} className="px-6 py-3 bg-[rgb(237,201,81)] text-black font-semibold rounded-lg hover:bg-[rgba(237,201,81,0.9)] transition-colors">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" strokeWidth="2">
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

