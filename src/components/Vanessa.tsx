import React from 'react';
import { useNearWallet } from '@/contexts/NearWalletContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useTokenPrices } from './TokenPriceDisplay';


import { getVanessaResponse, formatConversationHistory, ChatMessage } from '../utils/openai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Add helper function for wallet name truncation
function truncateWalletName(accountId: string | null): string {
  if (!accountId) return 'Stranger';
  if (!accountId.endsWith('.near')) return accountId;
  const name = accountId.slice(0, -5); // remove .near
  if (name.length <= 12) return accountId;
  return `${name.slice(0, 4)}...${name.slice(-4)}.near`;
}


// Simple welcome messages for different states
const getWelcomeMessage = (accountId: string | null): string => {
  if (accountId) {
    const userName = truncateWalletName(accountId);
    const messages = [
      `Welcome back, ${userName}! 🎴 The tables are calling your name. What shall we explore today, darling?`,
      `${userName}, perfect timing! The cards are fresh and the community is buzzing. What's on your mind?`,
      `Ah, ${userName}! So good to see you again. Ready to dive into some Web3 magic or shall we chat strategy?` 
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    return "Hello there, darling! I'm Vanessa, your charming guide through the exciting world of Wars of Cards. ✨\n\nI'm here to make your Web3 gaming journey as smooth as silk. \n\nReady to join the most welcoming card room in Web3? Let's get you logged in!";
  }
};

// Add helper function for formatting date
const formatMessageTime = (timestamp: Date) => {
  return timestamp.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export function Vanessa() {
  // Add hooks
  const wallet = useNearWallet();
  const { networkId } = useNetwork();
  const tokenPrices = useTokenPrices();
  
  // Using React.useState
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState(0); // Add this state for forcing re-render
  
  // Store container ID for direct DOM access
  const messagesContainerId = 'messages-container';
  const inputId = 'chat-input';

  // Add reset state function
  const resetState = React.useCallback(() => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
  }, []);

  // Add effect to handle wallet connection changes
  React.useEffect(() => {
    resetState();
    const initializeChat = async () => {
      if (wallet.accountId) {
        console.log('Wallet connected, accountId:', wallet.accountId);
        // Add small delay to ensure wallet is fully connected
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const welcomeMessage = getWelcomeMessage(wallet.accountId);
        
        // Force a clean state with only the welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      } else {
        console.log('No wallet connected, using guest mode');
        setMessages([{
          id: '1',
          role: 'assistant',
          content: getWelcomeMessage(null),
          timestamp: new Date()
        }]);
      }
    };

    initializeChat();
  }, [wallet.accountId, resetState]); // Add resetState to dependencies

  // Scroll to bottom after messages change
  React.useEffect(() => {
    const container = document.getElementById(messagesContainerId);
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Focus input when component mounts
  React.useEffect(() => {
    const input = document.getElementById(inputId) as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  }, []);
  
  const handleTextareaChange = (e: any) => {
    if (!wallet.accountId) {
      e.preventDefault();
      wallet.connect();
      return;
    }
    setInputValue(e.target.value);
    if (e.target) {
      e.target.style.height = 'inherit';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: any) => {
    if (!wallet.accountId) {
      e.preventDefault();
      wallet.connect();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!wallet.accountId) {
      wallet.connect();
      return;
    }
    if (!inputValue.trim()) return;
    
    // Store message content and clear input immediately
    const messageContent = inputValue.trim();
    setInputValue('');
    
    // Reset textarea height
    const input = document.getElementById(inputId) as HTMLTextAreaElement;
    if (input) {
      input.style.height = 'inherit';
    }
    
    // Add user message to chat immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Delay before showing typing indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(true);
      
      // Add typing indicator with animation and delay before response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate typing time
      
      // Get response from OpenAI
      const conversationHistory = formatConversationHistory(messages);
      const botResponse = await getVanessaResponse(messageContent, conversationHistory, wallet.accountId);
      
      // Add bot response with animation
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please check your OpenAI API key configuration and try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full max-h-[calc(100vh-56px-60px)] flex flex-col overflow-hidden p-2 md:p-4 box-border relative">
      <div className="w-full h-[calc(100vh-116px)] max-h-[calc(100vh-116px)] flex flex-col overflow-hidden border-none bg-gradient-to-br from-[rgba(0,0,0,0.92)] to-[rgba(0,0,0,0.95)] rounded-lg border border-[rgba(237,201,81,0.3)] shadow-[0_4px_16px_rgba(0,0,0,0.2),_0_0_24px_rgba(237,201,81,0.1)] backdrop-blur-[10px] p-3 md:p-5 box-border">
        <div id={messagesContainerId} className="flex-1 overflow-y-auto p-3 flex flex-col bg-[rgba(0,0,0,0.2)] min-h-0 max-h-[calc(100vh-220px)] w-full mb-4 rounded-lg border border-[rgba(237,201,81,0.15)] scrollbar-thin scrollbar-thumb-[rgba(237,201,81,0.3)] scrollbar-track-[rgba(0,0,0,0.1)] hover:scrollbar-thumb-[rgba(237,201,81,0.5)]">
          <div className="flex flex-col gap-2 h-auto w-full pb-2">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col w-full animate-[fadeIn_0.3s_ease-out] m-0 ${msg.role === 'user' ? 'self-end w-fit max-w-[85%]' : 'self-stretch w-full'}`}
              >
                <div className="bg-cover bg-center border border-[rgba(237,201,81,0.25)] rounded-lg overflow-hidden w-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] opacity-0 translate-y-[10px] animate-[slideIn_0.3s_ease-out_forwards] bg-gradient-to-br from-[rgba(0,0,0,0.3)] to-[rgba(0,0,0,0.3)]">
                  <div className="p-2 md:p-3 bg-[rgba(0,0,0,0.4)] border-b border-[rgba(237,201,81,0.25)] flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={msg.role === 'user' ? `https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${wallet.accountId}` : '/vanessa.png'}
                        alt={msg.role === 'user' ? truncateWalletName(wallet.accountId) : 'Vanessa AI'}
                        className={`w-8 h-8 ${msg.role === 'user' ? 'rounded-full border-2 border-[rgb(237,201,81)]' : ''} object-contain bg-[rgba(0,0,0,0.2)] ${msg.role === 'user' && !wallet.accountId ? 'blur-[5px] opacity-70' : ''}`}
                        style={{ imageRendering: 'auto' }}
                      />
                      <span className="text-sm holographic-text font-semibold text-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {msg.role === 'user' ? truncateWalletName(wallet.accountId) : 'Vanessa AI'}
                      </span>
                    </div>
                    <span className="text-xs holographic-text-subtle ml-auto font-normal text-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className={`p-3 leading-6 text-[0.95rem] text-shadow-[0_1px_1px_rgba(0,0,0,0.3)] ${msg.role === 'user' ? 'bg-[rgba(237,201,81,0.1)] font-medium shadow-[0_4px_15px_rgba(0,0,0,0.2),_0_2px_5px_rgba(237,201,81,0.1)] holographic-text-subtle' : 'bg-[rgba(0,0,0,0.3)] font-normal shadow-[0_4px_15px_rgba(0,0,0,0.2),_0_2px_5px_rgba(237,201,81,0.1)] text-white'}`}>
                    {msg.role === 'user' ? (
                      msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))
                    ) : (
                      <span>
                        {msg.content.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < msg.content.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </span>
                    )}
                    
                    {/* Add login button for guest users */}
                    {msg.role === 'assistant' && 
                     msg.id === messages.filter(m => m.role === 'assistant').slice(-1)[0]?.id && 
                     !isLoading && 
                     !wallet.accountId && (
                      <div className="flex flex-wrap gap-2 mt-4 justify-start">
                        <button
                          className="px-3 py-2 bg-[rgba(237,201,81,0.4)] border-2 border-[rgba(237,201,81,0.7)] rounded-md holographic-text-strong text-sm cursor-pointer transition-all duration-200 whitespace-nowrap text-center font-semibold animate-[blinkingButton_2s_infinite]"
                          onClick={() => wallet.connect()}
                        >
                          Log In
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex flex-col w-full animate-[fadeIn_0.3s_ease-out] m-0 self-stretch">
                <div className="bg-cover bg-center border border-[rgba(237,201,81,0.25)] rounded-lg overflow-hidden w-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] opacity-0 translate-y-[10px] animate-[slideIn_0.3s_ease-out_forwards] bg-gradient-to-br from-[rgba(0,0,0,0.3)] to-[rgba(0,0,0,0.3)]">
                  <div className="p-2 md:p-3 bg-[rgba(0,0,0,0.4)] border-b border-[rgba(237,201,81,0.25)] flex items-center gap-3">
                    <img 
                      src="/vanessa.png"
                      alt="Vanessa"
                      className="w-8 h-8 object-contain bg-[rgba(0,0,0,0.2)]"
                      style={{ imageRendering: 'auto' }}
                    />
                    <span className="text-sm holographic-text font-semibold">Vanessa AI</span>
                  </div>
                  <div className="p-3 text-white leading-6 text-[0.95rem] bg-[rgba(0,0,0,0.3)] text-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full min-h-[50px] p-3 bg-[rgba(0,0,0,0.2)] flex gap-3 items-center rounded-lg border border-[rgba(237,201,81,0.25)] relative bottom-0">
          <textarea
            id={inputId}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={wallet.accountId ? "Type your message here..." : "Log in to chat with Vanessa..."}
            style={{
              '--placeholder-color': 'rgba(255,255,255,0.5)',
              '--placeholder-holographic': 'linear-gradient(45deg, rgba(237,201,81,0.5) 0%, rgba(255,215,0,0.4) 25%, rgba(255,182,193,0.3) 50%, rgba(173,216,230,0.3) 75%, rgba(237,201,81,0.5) 100%)'
            } as React.CSSProperties}
            className="flex-1 p-3 px-4 rounded-md border border-[rgba(237,201,81,0.7)] bg-[rgba(0,0,0,0.4)] text-white text-[15px] resize-none font-inherit min-h-[40px] max-h-[80px] box-border focus:outline-none focus:border-[rgb(237,201,81)] placeholder:text-[rgba(255,255,255,0.5)]"
            rows={1}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()} 
            className="h-[40px] min-w-[80px] px-4 rounded-md border border-[rgb(237,201,81)] bg-[rgba(0,0,0,0.4)] text-[rgb(237,201,81)] cursor-pointer font-semibold text-[15px] flex items-center justify-center box-border transition-all duration-200 hover:bg-[rgb(237,201,81)] hover:text-[rgb(0,0,0)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
