import React, { useState, useEffect } from 'react';
import { useNearWallet } from '../contexts/NearWalletContext';
import { useNetwork } from '../contexts/NetworkContext';

import { getChatContractId, chatContract, formatNearAmount, parseNearAmount, formatTimestamp, type ChatMessage } from '../utils/chatContract';

const Chat: React.FC = () => {
  const wallet = useNearWallet();
  const { 
    accountId, 
    isConnected, 
    connect, 
    disconnect,
    executeTransaction,
    isLoading 
  } = wallet;
  
  const { networkId } = useNetwork();

  // Storage Balance State
  const [storageBalance, setStorageBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Message Input State
  const [newMessage, setNewMessage] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const MAX_MESSAGE_LENGTH = 1000;
  
  // Transaction States
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  
  // Error State
  const [error, setError] = useState<string | null>(null);

  // Storage Modal State
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Loading state helper
  const isAnyTransactionPending = isDepositing || isWithdrawing || isSendingMessage;

  // Load storage balance when wallet connects - with optimization
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadStorageBalance = async () => {
      if (!accountId || !isConnected || !mounted) {
        setStorageBalance('0');
        setHasCheckedStorage(false);
        return;
      }

      // Prevent multiple simultaneous calls
      if (isLoadingBalance) {
        return;
      }

      setIsLoadingBalance(true);
      try {
        const balance = await chatContract.getStorageBalance(accountId, wallet);
        if (mounted) {
          setStorageBalance(balance);
          setHasCheckedStorage(true);
          
          // Check if storage is insufficient (less than 0.01 NEAR)
          const balanceInNear = parseFloat(formatNearAmount(balance));
          if (balanceInNear < 0.01) {
            setShowStorageModal(true);
          } else {
            // Close modal if we have sufficient balance
            setShowStorageModal(false);
          }
        }
      } catch (error) {
        console.error('Error loading storage balance:', error);
        if (mounted) {
          setStorageBalance('0');
          setHasCheckedStorage(true);
          setShowStorageModal(true); // Show modal on error too
        }
      } finally {
        if (mounted) {
          setIsLoadingBalance(false);
        }
      }
    };

    // Debounce the loading to prevent multiple rapid calls
    timeoutId = setTimeout(() => {
      if (mounted && accountId && isConnected) {
        loadStorageBalance();
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [accountId, isConnected]); // Removed wallet from dependencies to prevent double calls

  // Auto-check storage balance periodically when modal is open
  useEffect(() => {
    if (!showStorageModal || !accountId || !isConnected) {
      return;
    }

    const checkBalanceInterval = setInterval(async () => {
      try {
        const balance = await chatContract.getStorageBalance(accountId, wallet);
        const balanceInNear = parseFloat(formatNearAmount(balance));
        
        if (balanceInNear >= 0.01) {
          setShowStorageModal(false);
          setStorageBalance(balance);
        }
      } catch (error) {
        console.error('Error checking storage balance:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkBalanceInterval);
  }, [showStorageModal, accountId, isConnected]);

  // Load messages when wallet connects
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadMessages = async () => {
      if (!accountId || !isConnected || !mounted) {
        setMessages([]);
        return;
      }

      // Prevent multiple simultaneous calls
      if (isLoadingMessages) {
        return;
      }

      setIsLoadingMessages(true);
      try {
        const messagesData = await chatContract.getMessages(wallet, 100);
        if (mounted) {
          setMessages(messagesData);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        if (mounted) {
          setMessages([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    // Debounce the loading to prevent multiple rapid calls
    timeoutId = setTimeout(() => {
      if (mounted && accountId && isConnected) {
        loadMessages();
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [accountId, isConnected]); // Removed wallet from dependencies to prevent double calls

  // Function to manually refresh storage balance - optimized
  const refreshStorageBalance = async () => {
    if (!accountId || !isConnected || isLoadingBalance || isAnyTransactionPending) {
      return;
    }
    
    setIsLoadingBalance(true);
    try {
      const balance = await chatContract.getStorageBalance(accountId, wallet);
      setStorageBalance(balance);
      
      // Check if we now have enough storage and close modal
      const balanceInNear = parseFloat(formatNearAmount(balance));
      if (balanceInNear >= 0.01) {
        setShowStorageModal(false);
      }
    } catch (error) {
      console.error('Error refreshing storage balance:', error);
      setError('Failed to refresh storage balance');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Function to manually refresh messages
  const refreshMessages = async () => {
    if (!accountId || !isConnected || isLoadingMessages || isAnyTransactionPending) {
      return;
    }
    
    setIsLoadingMessages(true);
    try {
      const messagesData = await chatContract.getMessages(wallet, 100);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error refreshing messages:', error);
      setError('Failed to refresh messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!accountId || !isConnected || isAnyTransactionPending || !newMessage.trim()) {
      return;
    }

    try {
      setIsSendingMessage(true);
      setError(null);

      const messageText = newMessage.trim();
      
      await chatContract.addMessage(wallet, messageText);
      
      // Clear input after successful send
      setNewMessage('');
      
      // Refresh both messages and storage balance after a short delay
      setTimeout(() => {
        refreshMessages();
        refreshStorageBalance();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle Enter key press in message input
  const handleMessageKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input change with character limit
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setNewMessage(value);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // Deposit storage with specific amount - optimized
  const depositStorage = async (nearAmount: string) => {
    if (!accountId || !isConnected || isAnyTransactionPending) {
      console.log('Skipping deposit: transaction already pending');
      return;
    }

    try {
      setIsDepositing(true);
      setError(null);

      const depositYocto = parseNearAmount(nearAmount);
      const contractId = getChatContractId();
      
      console.log('Depositing:', nearAmount, 'NEAR to contract:', contractId);
      
      await executeTransaction({
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
    } catch (err: any) {
      console.error('Error depositing storage:', err);
      setError(err.message || 'Failed to deposit storage');
    } finally {
      setIsDepositing(false);
    }
  };

  // Withdraw remaining storage balance - optimized
  const withdrawRemainingStorage = async () => {
    if (!accountId || !isConnected || isAnyTransactionPending) {
      console.log('Skipping withdraw: transaction already pending');
      return;
    }

    try {
      setIsWithdrawing(true);
      setError(null);

      const contractId = getChatContractId();
      console.log('Withdrawing remaining storage from contract:', contractId);
      
      await executeTransaction({
        contractId,
        methodName: 'withdraw_remain_storage',
        args: { amount: null }, // Withdraw all remaining
        gas: '30000000000000',
        deposit: '0',
        onSuccess: () => {
          console.log('Withdraw transaction successful');
          // Delayed refresh with single call
          setTimeout(() => refreshStorageBalance(), 3000);
        }
      });
    } catch (err: any) {
      console.error('Error withdrawing storage:', err);
      setError(err.message || 'Failed to withdraw storage');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl md:max-w-5xl px-3 md:px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-[rgba(237,201,81,0.8)]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 md:px-4 py-2 sm:py-4 relative h-[calc(100vh-80px)]">
            {/* Main Chat Layout */}
      <div className="h-full">
        
        {/* Chat Messages - Full width */}
        <div className="flex flex-col h-full">
           {/* Messages Container */}
           <div className="flex-1 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(237,201,81,0.2)] overflow-hidden flex flex-col">
            {!isConnected ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-[rgba(237,201,81,0.6)] mb-4">Connect your wallet to start chatting</div>
                  <button
                    onClick={connect}
                    className="px-6 py-3 bg-[rgb(237,201,81)] text-black font-semibold rounded-lg hover:bg-[rgba(237,201,81,0.9)] transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Header */}
                <div className="px-2 sm:px-4 py-2 bg-[rgba(0,0,0,0.4)] border-b border-[rgba(237,201,81,0.25)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Info icon with tooltip */}
                    <div className="relative group">
                      <div className="w-5 h-5 bg-[rgb(237,201,81)] text-black rounded-full flex items-center justify-center text-xs font-bold cursor-help">
                        !
                      </div>
                      {/* Tooltip - positioned to the right */}
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-[rgba(0,0,0,0.9)] text-[rgb(237,201,81)] text-xs rounded-lg border border-[rgba(237,201,81,0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        You can deposit or withdraw storage in your profile
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-[rgba(237,201,81,0.3)]"></div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={refreshMessages}
                    disabled={isLoadingMessages || isAnyTransactionPending}
                    className="text-xs px-2 py-1 bg-[rgba(237,201,81,0.2)] text-[rgb(237,201,81)] rounded hover:bg-[rgba(237,201,81,0.3)] transition-colors disabled:opacity-50"
                    title="Refresh messages"
                  >
                    {isLoadingMessages ? '⟳' : '↻'}
                  </button>
                </div>

                                 {/* Messages List */}
                 <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-[rgba(237,201,81,0.6)]">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-[rgba(237,201,81,0.6)]">No messages yet</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.slice().reverse().map((message, index) => (
                        <div
                          key={index}
                          className={`w-full ${
                            message.account_id === accountId ? 'flex justify-end' : 'flex justify-start'
                          }`}
                        >
                          <div className={`${
                            message.account_id === accountId ? 'max-w-md' : 'w-full'
                          }`}>
                            {/* Message Box with Header */}
                            <div className="bg-[rgba(0,0,0,0.3)] border border-[rgba(237,201,81,0.25)] rounded-lg overflow-hidden shadow-lg">
                              {/* Message Header */}
                              <div className="px-3 py-2 bg-[rgba(0,0,0,0.4)] border-b border-[rgba(237,201,81,0.25)] flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <img 
                                    src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${message.account_id}`}
                                    alt={message.account_id}
                                    className="w-8 h-8 rounded-full border-2 border-[rgb(237,201,81)] object-cover flex-shrink-0"
                                    onError={(e) => {
                                      // Fallback to a default avatar if image fails to load
                                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.account_id)}&background=edc951&color=000&size=32`;
                                    }}
                                  />
                                  <span className="text-[rgb(237,201,81)] font-semibold text-sm truncate">
                                    {message.account_id}
                                  </span>
                                </div>
                                <span className="text-[rgba(237,201,81,0.7)] text-xs flex-shrink-0 ml-2">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              
                              {/* Message Content */}
                              <div className="px-4 py-3 bg-[rgba(0,0,0,0.3)]">
                                <div className="text-[rgb(237,201,81)] text-sm leading-relaxed">
                                  {message.message}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                                 {/* Message Input */}
                 <div className="p-2 sm:p-4 border-t border-[rgba(237,201,81,0.25)] bg-[rgba(0,0,0,0.2)] flex-shrink-0">
                  <div className="flex gap-2 mb-2">
                                         <input
                       type="text"
                       value={newMessage}
                       onChange={handleInputChange}
                       onKeyPress={handleMessageKeyPress}
                       placeholder="Type your message..."
                       disabled={isSendingMessage || isAnyTransactionPending}
                       className="flex-1 px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(237,201,81,0.3)] rounded-lg text-[rgb(237,201,81)] placeholder-[rgba(237,201,81,0.5)] focus:outline-none focus:border-[rgb(237,201,81)] disabled:opacity-50"
                       maxLength={MAX_MESSAGE_LENGTH}
                     />
                    <button
                      onClick={sendMessage}
                      disabled={isSendingMessage || isAnyTransactionPending || !newMessage.trim()}
                      className="px-4 py-2 bg-[rgb(237,201,81)] text-black font-semibold rounded-lg hover:bg-[rgba(237,201,81,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send message"
                    >
                      {isSendingMessage ? '⟳' : 'Send'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[rgba(237,201,81,0.5)]">
                    <span>Press Enter to send</span>
                    <span>{newMessage.length}/{MAX_MESSAGE_LENGTH}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-red-900/90 border border-red-500/50 rounded-lg p-3 max-w-md w-full mx-4">
          <div className="text-red-400 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="absolute top-1 right-1 text-xs text-red-300 hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Storage Deposit Modal */}
      {showStorageModal && (
        <div className="absolute inset-0 bg-black/70 z-10 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[rgba(0,0,0,0.95)] border border-[rgba(237,201,81,0.3)] rounded-lg w-full max-w-sm sm:max-w-md mx-4 p-3 sm:p-4 backdrop-blur">
            <div className="mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-[rgb(237,201,81)] mb-2">Chat Storage Required</h3>
              <p className="text-xs text-[rgba(237,201,81,0.7)] mb-3">
                You need more NEAR in chat storage to send messages. Current balance: {formatNearAmount(storageBalance)} NEAR
              </p>
            </div>

            {/* Storage Balance */}
            <div className="mb-3">
              <div className="text-xs text-[rgba(237,201,81,0.6)] mb-1">Current Storage Balance</div>
              <div className="text-sm sm:text-base font-bold text-[rgb(237,201,81)]">
                {isLoadingBalance ? 'Loading...' : `${formatNearAmount(storageBalance)} NEAR`}
              </div>
            </div>

            {/* Deposit Storage */}
            <div className="mb-3">
              <div className="text-xs text-[rgba(237,201,81,0.6)] mb-2">Deposit Storage</div>
              <div className="grid grid-cols-2 gap-2">
                {['0.1', '0.3', '0.5', '1'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => depositStorage(amount)}
                    disabled={isDepositing || isWithdrawing}
                    className="px-2 py-2 sm:py-1 bg-[rgb(237,201,81)] text-black font-semibold rounded hover:bg-[rgba(237,201,81,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    title={`Deposit ${amount} NEAR for storage`}
                  >
                    {isDepositing ? '⟳' : `${amount} Ⓝ`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;
