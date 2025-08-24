import React from 'react';
import { useNearWallet } from '@/contexts/NearWalletContext';
import { providers } from 'near-api-js';
import { getNetworkConfig, useNetwork } from '@/contexts/NetworkContext';
import { useTokenPrices } from './TokenPriceDisplay';
import { BN } from 'bn.js';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { Big } from 'big.js';
import { TypewriterText } from '../effects/TypewriterText';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Add predefined topics and responses
const predefinedResponses: Record<string, string> = {
  'hello': 'I\'m Vanessa, your Wars of Cards guide. I can help with platform navigation and blockchain transactions. What aspect of our games interests you?',
  
  'what_to_do': 'Play card games including:\n- Snapjack (entry: 210 CRANS, potential win: 378 CRANS)\n- New War Order, a strategic card game (entry: 420 CRANS, potential win: 756 CRANS)\n\nCurrency operations:\n- Check balances of NEAR and CRANS tokens\n- Swap between NEAR tokens and CRANS tokens with commands like "5 near to crans"\n\nCommunity interaction:\n- Connect with other players through a Messages hub\n- Earn Points through participation that can be converted to NEAR tokens\n- Access exclusive token airdrops and special perks',
  
  'games': 'If you want to play, you need to get CRANS tokens by exchanging your NEAR tokens - type \'swap\' and follow the commands.\n\nSNAPJACK: This classic card game pits you against the dealer where you aim for 21 without busting, with an instant win if you hit 21 exactly. You win by beating the dealer\'s hand while our advanced shuffle system prevents card counting, offering a 180% return on your 210 CRANS entry with potential winnings of 378 CRANS.\n\nNEW WAR ORDER: This strategic card game challenges you to win the most battles within a tense 3-minute timeframe using a unique 55-card deck that includes 3 Jokers. The game features special rules like "TWIST" with the number 7 and exciting "WAR" moments triggered by matching cards or Jokers, all while competing for a potential 756 CRANS prize from your 420 CRANS entry, offering an impressive 180% return.',
  
  'messages': 'Our Messages hub is the central network of the Wars of Cards community.\n\nKey features:\n- Connect directly with other players through comments\n- Support content with your NEAR account\n- Accumulate Points through active participation\n- Convert Points to NEAR tokens\n\nCommunity benefits:\n- Access exclusive token airdrops\n- Unlock special perks as an active member\n- Gain recognition for your contributions\n\nThe connections you make here have real value. Join in, engage regularly, and experience the advantages of being part of our Wars of Cards network.',
  
  'near': 'NEAR: The Premium Blockchain Behind Wars of Cards\n\nKey Advantages:\n- High-speed transaction processing\n- Minimal fees for all operations\n- Confirmation times in seconds\n- Intuitive interface design\n\nFor First-time Blockchain Users:\n- Think of NEAR as your digital wallet and identity in one\n- Significantly faster and cheaper than traditional systems\n\nYour NEAR Account:\n- Single login serves as both username and secure wallet\n- Seamless, protected gameplay integration\n- Full control and ownership of your digital assets\n\nOur platform leverages NEAR\'s capabilities to deliver an exceptional gaming experience with maximum security and efficiency.',
  
  'crans': 'Official Site: https://money.crans.xyz/\n\nAcquiring CRANS:\n- Use "swap" to convert your NEAR tokens instantly\n- Win additional tokens through gameplay\n- Earn through community participation and events\n\nToken Usage:\n- Snapjack: 210 CRANS entry with 378 CRANS potential win\n- New War Order: 420 CRANS entry with 756 CRANS potential win\n- All wins pay 180% of your original stake\n\nReady for tokens? Select "SWAP" and I\'ll walk you through the process.',
  
  'help': 'Allow pop-ups in your browser and for the smoothest gameplay, use Chrome browser. Also, make sure to turn off VPN to avoid any issues.\n\nFor First-time Blockchain Users: \nThink of NEAR as your digital wallet and identity in one that\'s significantly faster and cheaper than traditional systems, powering the Wars of Cards gaming experience with high-speed transactions, minimal fees, and full ownership of your digital assets.\n\nEssential Requirements:\n- NEAR account - Connect or create instantly through Meteor Wallet\n- NEAR tokens - Available on Binance, Coinbase, and major exchanges\n- CRANS tokens - Exchange your NEAR tokens with me directly\n\nAcquiring CRANS:\n- Use "Swap" and follow the commands to convert your NEAR tokens instantly\n- Win additional tokens through our games\n- Earn through community participation and events\n\nToken Usage:\n- Snapjack: 210 CRANS entry with 378 CRANS potential win\n- New War Order: 420 CRANS entry with 756 CRANS potential win\n- All wins pay 180% of your original stake\n- Sell your earned tokens with me directly or hold them!',
  
  'Exchange': 'Your current holdings:\nNEAR: {near_balance} Ⓝ\nCRANS: {crans_balance} CRANS\n\n🔁 COMMANDS 🔁\n• swap 1 near\n• swap 1 crans\n• buy 1 crans\n• sell 1 crans\n\nIMPORTANT: You must allow popups for successful transactions.\nFirst-time transactions may fail if popups are blocked.\nEnable popups when prompted for seamless exchanges.',
  
  'balance': '💰 Here are your current balances:\n\nNEAR Balance: {near_balance} Ⓝ\nCRANS Balance: {crans_balance} CRANS',
  
  // Small talk responses
  'small_talk_positive': 'Thanks for the kind words! Is there something specific I can help you with regarding Wars of Cards?',
  'small_talk_neutral': 'I\'m here to help with any questions about Wars of Cards. Would you like to know about the games or how to use CRANS tokens?',
  'small_talk_compliment': 'That\'s very nice of you to say! I\'m designed to make your Wars of Cards experience exceptional. What would you like to explore today?',
  'small_talk_how_are_you': 'I\'m doing great, thanks for asking! I\'m always ready to help with Wars of Cards. How about you? Ready to explore our gaming platform?',
  
  // Responses to negative or inappropriate messages
  'negative_feedback': 'I understand. I\'m here to help improve your experience. Could you tell me how I can better assist you with Wars of Cards?',
  'inappropriate': 'I\'m focused on helping with Wars of Cards gaming platform. Let\'s keep our conversation professional. How can I assist you with games, tokens, or platform features?',
  
  // Identity and purpose response
  'identity': 'I\'m Vanessa, your digital assistant for the Wars of Cards platform. I help players navigate the platform, swap tokens, learn game rules, and more. I was created to make your gaming experience smoother by providing instant help and information. How can I assist you today?'
};

// Define main topics for clickable buttons - more compact
const mainTopics = [
  { id: 'what_to_do', label: 'What to do here?' },
  { id: 'games', label: 'How to play?' },
  { id: 'Exchange', label: 'Exchange' },
  { id: 'help', label: 'Help' }
];

// Add helper function for wallet name truncation
function truncateWalletName(accountId: string | null): string {
  if (!accountId) return 'Stranger';
  if (!accountId.endsWith('.near')) return accountId;
  const name = accountId.slice(0, -5); // remove .near
  if (name.length <= 12) return accountId;
  return `${name.slice(0, 4)}...${name.slice(-4)}.near`;
}

// Add helper function for token amounts
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

// Add balance fetching functions
async function fetchNearBalance(accountId: string, wallet: any, networkId: string): Promise<string> {
  try {
    if (!wallet.selector) return "0";
    
    const networkConfig = getNetworkConfig(networkId as any);
    const provider = new providers.JsonRpcProvider({ url: networkConfig.nodeUrl }) as any;
    const account = await provider.query({
      request_type: 'view_account',
      account_id: accountId,
      finality: 'final'
    });

    if (account.amount) {
      return formatTokenAmount(account.amount);
    }
    return "0";
  } catch (error) {
    console.error("Error fetching NEAR balance:", error);
    return "0";
  }
}

async function fetchCransBalance(accountId: string, wallet: any, networkId: string): Promise<string> {
  try {
    if (!wallet.selector) return "0";
    
    const networkConfig = getNetworkConfig(networkId as any);
    const result = await wallet.viewFunction({
      contractId: networkConfig.contracts.crans,
      methodName: "ft_balance_of",
      args: { account_id: accountId }
    });

    if (result) {
      return formatTokenAmount(result);
    }
    return "0";
  } catch (error) {
    console.error("Error fetching CRANS balance:", error);
    return "0";
  }
}

// Dodaj funkcję formatującą datę
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
  const [usedTopics, setUsedTopics] = React.useState<string[]>([]); // Track used topics
  
  // Store container ID for direct DOM access
  const messagesContainerId = 'messages-container';
  const inputId = 'chat-input';

  // Add reset state function
  const resetState = React.useCallback(() => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    setUsedTopics([]); // Reset used topics
  }, []);

  // Add effect to handle wallet connection changes
  React.useEffect(() => {
    resetState();
    const initializeChat = async () => {
      if (wallet.accountId) {
        console.log('Wallet connected, accountId:', wallet.accountId);
        // Add small delay to ensure wallet is fully connected
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const userName = truncateWalletName(wallet.accountId);
        const personalizedMessages = [
          `${userName}, welcome back. Wars Of Cards is ready for you. How can I assist today?`,
          `${userName}, perfect timing. What area of the platform would you like to explore?`,
          `${userName}, good to see you. What would you like to focus on first?` 
        ];
        
        const welcomeMessage = personalizedMessages[Math.floor(Math.random() * personalizedMessages.length)];
        
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
          content: "I'm Vanessa, your dedicated platform guide. I'm here to help you maximize your experience. \n\nAllow pop-ups in your browser and for the smoothest gameplay, use Chrome browser. Also, make sure to turn off VPN to avoid any issues. \n\nReady to log in and get started?",
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
  
  const handleTopicClick = async (topicId: string) => {
    // Handle login topic separately
    if (topicId === 'login') {
      try {
        await wallet.connect();
        return;
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }

    // Add topicId to used topics list (except for 'help' and 'Exchange' which should always be available)
    if (topicId !== 'help' && topicId !== 'Exchange') {
      setUsedTopics(prev => [...prev, topicId]);
    }

    // Create a user message for the clicked topic
    const topicLabel = mainTopics.find(topic => topic.id === topicId)?.label || topicId;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: topicLabel,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Process the response with typing animation
    try {
      // Delay before showing typing indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(true);
      
      // Add typing indicator with animation and delay before response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate typing time
      
      // Get response content
      const responseContent = await findBestResponse(topicId, wallet.accountId, wallet);
      
      // Only add bot response if it's not null
      if (responseContent !== null) {
        // Add bot response
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing topic:', error);
      setIsLoading(false);
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
      
      // Check if message is related to any topic
      const lowercaseMessage = messageContent.toLowerCase();
      
      // Check if message matches any main topic
      const matchedTopic = mainTopics.find(topic => 
        topic.label.toLowerCase() === lowercaseMessage || 
        topic.id.toLowerCase() === lowercaseMessage ||
        lowercaseMessage.includes(topic.label.toLowerCase()) ||
        lowercaseMessage.includes(topic.id.toLowerCase())
      );
      
      // Add to used topics if a match was found (except for 'help' and 'swap')
      if (matchedTopic && matchedTopic.id !== 'help' && matchedTopic.id !== 'swap') {
        setUsedTopics(prev => [...prev, matchedTopic.id]);
      }
      
      // Find appropriate response from predefined answers
      const botResponse = await findBestResponse(messageContent, wallet.accountId, wallet);
      
      // Only add bot response if it's not null
      if (botResponse !== null) {
        // Add bot response with animation
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add fallback error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify findBestResponse to use new state management
  async function findBestResponse(input: string, accountId: string | null, wallet: any): Promise<string | null> {
    input = input.toLowerCase();
    
    // Helper function to check if input matches small talk patterns
    const checkSmallTalk = (input: string): string | null => {
      // Positive phrases
      const positivePatterns = [
        'nice', 'good', 'great', 'awesome', 'amazing', 'excellent', 'cool', 'wow', 
        'thanks', 'thank you', 'thx', 'ty', 'ok', 'okay', 'k', 'sounds good', 
        'perfect', 'sure', 'absolutely', 'indeed', 'right'
      ];
      
      // Compliments
      const complimentPatterns = [
        'like you', 'love you', 'you are great', 'you are good', 'you are nice', 
        'you are amazing', 'you are awesome', 'you are helpful', 'you are cool',
        'you\'re great', 'you\'re good', 'you\'re nice', 'you\'re amazing',
        'you\'re awesome', 'you\'re helpful', 'you\'re cool', 'you rock'
      ];
      
      // How are you patterns
      const howAreYouPatterns = [
        'how are you', 'how you doing', 'how\'s it going', 'how is it going',
        'how are things', 'how have you been', 'how\'s your day', 'how is your day',
        'are you ok', 'are you okay', 'are you well', 'are you good',
        'what\'s up', 'whats up', 'sup', 'hows it going', 'how are u'
      ];
      
      // Check "how are you" type questions
      for (const pattern of howAreYouPatterns) {
        if (input.includes(pattern)) {
          return predefinedResponses['small_talk_how_are_you'];
        }
      }
      
      // Check positive phrases - more strict matching to avoid false positives
      for (const pattern of positivePatterns) {
        // Check for exact match or word boundaries
        if (input === pattern || 
            input.match(new RegExp(`\\b${pattern}\\b`)) ||
            input === `that's ${pattern}` || 
            input === `thats ${pattern}` ||
            input === `that is ${pattern}`) {
          return predefinedResponses['small_talk_positive'];
        }
      }
      
      // Check compliments - more specific matching
      for (const pattern of complimentPatterns) {
        if (input.includes(pattern) && !input.includes('don\'t') && !input.includes('dont') && !input.includes('not')) {
          return predefinedResponses['small_talk_compliment'];
        }
      }
      
      return null;
    };
    
    // Helper function to check if input contains inappropriate content
    const checkInappropriate = (input: string): string | null => {
      const negativePatterns = [
        'bad', 'terrible', 'awful', 'worst', 'hate', 'dislike', 'annoying',
        'useless', 'stupid', 'dumb', 'not good', 'not helpful', 'not working',
        'doesn\'t work', 'doesn\'t help', 'don\'t like', 'don\'t want'
      ];
      
      const inappropriatePatterns = [
        'fuck', 'shit', 'damn', 'bitch', 'crap', 'ass', 'asshole', 'idiot',
        'screw you', 'fuck you', 'go to hell', 'stupid bot', 'dumb bot', 
        'shut up', 'shut down', 'stfu'
      ];
      
      // Check for inappropriate messages first - higher priority
      for (const pattern of inappropriatePatterns) {
        if (input.includes(pattern)) {
          return predefinedResponses['inappropriate'];
        }
      }
      
      // Check for general negative feedback
      for (const pattern of negativePatterns) {
        // More precise matching for negative patterns
        if (input === pattern || 
            input.match(new RegExp(`\\b${pattern}\\b`)) ||
            input === `that's ${pattern}` || 
            input === `thats ${pattern}` ||
            input === `that is ${pattern}` ||
            input.includes(`really ${pattern}`)) {
          return predefinedResponses['negative_feedback'];
        }
      }
      
      return null;
    };
    
    // Check for inappropriate content FIRST
    const inappropriateResponse = checkInappropriate(input);
    if (inappropriateResponse) {
      return inappropriateResponse;
    }
    
    // Check for small talk AFTER checking for inappropriate content
    const smallTalkResponse = checkSmallTalk(input);
    if (smallTalkResponse) {
      return smallTalkResponse;
    }
    
    // Handle greetings
    const greetings = ['hey', 'hi', 'hello', 'sup', 'howdy'];
    if (greetings.includes(input)) {
      return predefinedResponses['hello'];
    }
    
    // Handle login command
    if (input === 'login' || input === 'log in') {
      try {
        await wallet.connect();
        return "Connecting your wallet...";
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return "There was an error connecting your wallet. Please try again.";
      }
    }
    
    // Define keywords to detect in user messages
    const keywordHandlers: Record<string, () => Promise<string | null>> = {
      'balance': async () => {
        if (!accountId) {
          return "🔒 Please connect your wallet first to check your balances.\n\nYou can do this by clicking the 'Log In' button above.";
        }
        
        try {
          const [nearBalance, cransBalance] = await Promise.all([
            fetchNearBalance(accountId, wallet, networkId),
            fetchCransBalance(accountId, wallet, networkId)
          ]);
          
          return `💰 Here are your current balances:\n\nNEAR Balance: ${nearBalance} Ⓝ\nCRANS Balance: ${cransBalance} CRANS`;
        } catch (error) {
          console.error('Error fetching balances:', error);
          return "⚠️ I encountered an error fetching your balances.\n\nPlease try again in a moment or check your connection.";
        }
      },
      'Exchange': async () => {
        if (!accountId) {
          return "🔒 Please connect your wallet first to use the exchange feature.\n\nYou can do this by clicking the 'Log In' button above.";
        }
        
        try {
          const [nearBalance, cransBalance] = await Promise.all([
            fetchNearBalance(accountId, wallet, networkId),
            fetchCransBalance(accountId, wallet, networkId)
          ]);
          
          return `Your current holdings:
NEAR: ${nearBalance} Ⓝ
CRANS: ${cransBalance} CRANS

🔁 COMMANDS 🔁 
• swap 1 near
• swap 1 crans
• buy 1 crans
• sell 1 crans

IMPORTANT: You must allow popups for successful transactions. First-time transactions will fail if pop-ups are blocked.`;
        } catch (error) {
          console.error('Error fetching balances:', error);
          return "⚠️ I encountered an error fetching your balances.\n\nPlease try again in a moment or check your connection.";
        }
      },
      'topics': () => Promise.resolve(`📋 Here are the main topics I can help you with:\n\n${mainTopics.map(topic => `• ${topic.label}`).join('\n')}\n\nWhich topic would you like to explore?`)
    };

    // Helper function to detect intention based on context patterns
    const detectIntention = (input: string): string | null => {
      // Intention mapping with context patterns
      const intentionPatterns: Record<string, string[]> = {
        'what_to_do': [
          'what can i do', 'what can i do here', 'what should i do', 'what to do',
          'what you offer', 'what you offering', 'what are you offering', 'you are offering',
          'what do you offer', 'what does this offer', 'what can you offer',
          'what is this for', 'what is this about', 'what is this place',
          'how to use', 'how to start', 'getting started', 'where to start',
          'show me options', 'available options', 'what are my options', 
          'what is possible', 'what can be done', 'what is available'
        ],
        
        'games': [
          'how to play', 'how do i play', 'game rules', 'rules of the game',
          'tell me about games', 'explain the games', 'how games work',
          'snapjack rules', 'war order rules', 'card games rules',
          'tell me the rules', 'what are the rules', 'how does game work',
          'game instructions', 'how to win', 'how do i win',
          
          // Dodane wzorce związane z konkretnymi grami
          'snapjack', 'what is snapjack', 'whats snapjack', 'what\'s snapjack',
          'tell me about snapjack', 'explain snapjack', 'snapjack game',
          'new war order', 'what is new war order', 'whats new war order', 'what\'s new war order',
          'tell me about new war order', 'explain new war order', 'war order game',
          'nwo', 'what is nwo', 'whats nwo', 'what\'s nwo'
        ],
        
        'Exchange': [
          // Original swap related phrases
          'swap tokens', 'exchange tokens', 'trade tokens', 'convert tokens',
          'how to swap', 'how to exchange', 'how to convert',
          'change near to crans', 'change crans to near',
          'let\'s swap', 'want to swap', 'need to swap', 'need tokens',
          'get crans', 'exchange near',
          
          // New buying/selling related phrases
          'buy tokens', 'purchase tokens', 'sell tokens', 'buy some tokens',
          'purchase some tokens', 'want to buy', 'want to sell', 'want to purchase',
          'how to buy', 'how to sell', 'how to purchase',
          'let\'s buy', 'need to buy', 'need to sell', 'i want to buy',
          'i want to sell', 'buy near', 'sell near', 'buy some near',
          'buy some crans', 'sell some near', 'sell some crans',
          'trade near', 'trade crans', 'convert near', 'convert crans',
          'get some tokens', 'get tokens', 'get some crans', 'get some near',
          
          // Dodane wzorce związane z "coins"
          'buy coins', 'sell coins', 'buy some coins', 'sell some coins',
          'purchase coins', 'purchase some coins', 'get coins', 'get some coins',
          'trade coins', 'convert coins', 'exchange coins', 'want to buy coins',
          'want to sell coins', 'need coins', 'need some coins', 'let\'s buy coins',
          'how to buy coins', 'how to sell coins',
          
          // Dodane nowe wzorce rozpoznające nowe komendy
          'buy crans command', 'sell crans command', 'quick buy', 'quick sell', 
          'shortcut to buy', 'shortcut to sell', 'fastest way to buy', 'fastest way to sell',
          'simple buy', 'simple sell', 'command for buying', 'command for selling'
        ],
        
        'help': [
          'need help', 'can you help', 'help me', 'how does this work',
          'having trouble', 'not working', 'having a problem', 'got a problem',
          'how to use', 'instructions', 'guide me', 'show me how',
          'explain how'
        ],
        
        'identity': [
          'who are you', 'what are you', 'tell me about yourself', 'about you',
          'your name', 'who is vanessa', 'what is vanessa', 'who made you',
          'what do you do', 'your purpose', 'your function', 'your role',
          'how do you work', 'are you a bot', 'are you ai', 'are you human',
          'are you real', 'are you a person', 'introduce yourself',
          'tell me who you are', 'what is your name', 'who am i talking to'
        ]
      };
      
      // Add variations with common typos and partial matches
      const normalizeInput = (text: string): string => {
        return text
          .replace(/'/g, '') // Remove apostrophes
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };
      
      const normalizedInput = normalizeInput(input);
      
      // Debug log to console
      console.log('Normalized input:', normalizedInput);
      
      // Check each intention pattern
      for (const [intention, patterns] of Object.entries(intentionPatterns)) {
        for (const pattern of patterns) {
          const normalizedPattern = normalizeInput(pattern);
          
          // Check for exact matches, word boundary matches, or substring matches
          if (normalizedInput === normalizedPattern || 
              normalizedInput.includes(normalizedPattern) ||
              // Special case for "what you are offering" and variations
              (intention === 'what_to_do' && 
               (normalizedInput.includes('offer') || 
                normalizedInput.includes('what you') ||
                /what.*offering/.test(normalizedInput))) ||
              // Special case for identity questions
              (intention === 'identity' && 
               (/who.*you/.test(normalizedInput) || 
                /what.*you/.test(normalizedInput) ||
                /your.*name/.test(normalizedInput) ||
                /about.*you/.test(normalizedInput))) ||
              // Special case for game questions
              (intention === 'games' && 
               (/what.*snapjack/.test(normalizedInput) ||
                /tell.*snapjack/.test(normalizedInput) ||
                /what.*war.*order/.test(normalizedInput) ||
                /tell.*war.*order/.test(normalizedInput) ||
                /explain.*snapjack/.test(normalizedInput) ||
                /explain.*war.*order/.test(normalizedInput) ||
                /about.*snapjack/.test(normalizedInput) ||
                /about.*war.*order/.test(normalizedInput))) ||
              // Special case for token buying and selling
              (intention === 'Exchange' && 
               (/buy.*token/.test(normalizedInput) || 
                /sell.*token/.test(normalizedInput) ||
                /purchase.*token/.test(normalizedInput) ||
                /get.*token/.test(normalizedInput) ||
                /want.*buy/.test(normalizedInput) ||
                /want.*sell/.test(normalizedInput) ||
                /buy.*coins/.test(normalizedInput) ||
                /sell.*coins/.test(normalizedInput) ||
                /purchase.*coins/.test(normalizedInput) ||
                /get.*coins/.test(normalizedInput)))) {
            console.log('Matched intention:', intention, 'with pattern:', pattern);
            return intention;
          }
        }
      }
      
      return null;
    };
    
    // Check for content-based intentions
    const intention = detectIntention(input);
    if (intention) {
      // For swap and balance intencje, use handlers instead of predefined responses
      // to properly fill in placeholders with actual values
      if (intention === 'Exchange' && keywordHandlers['Exchange']) {
        return await keywordHandlers['Exchange']();
      } else if (intention === 'balance' && keywordHandlers['balance']) {
        return await keywordHandlers['balance']();
      }
      return predefinedResponses[intention];
    }

    // Check if input contains any of the defined keywords
    for (const [keyword, handler] of Object.entries(keywordHandlers)) {
      if (input.includes(keyword)) {
        return await handler();
      }
    }
    
    // Handle topic names in lowercase
    const lowercaseInput = input.toLowerCase().trim();
    const matchedTopic = mainTopics.find(topic => 
      topic.label.toLowerCase() === lowercaseInput || 
      topic.id.toLowerCase() === lowercaseInput
    );
    
    if (matchedTopic) {
      // Special handling for Exchange - use the handler function
      if (matchedTopic.id === 'Exchange' && keywordHandlers['Exchange']) {
        return await keywordHandlers['Exchange']();
      }
      return predefinedResponses[matchedTopic.id] || `💫 Let me tell you about ${matchedTopic.label}...`;
    }
    
    // Special handling for the word "swap" by itself - trigger Exchange handler
    if (lowercaseInput === 'swap') {
      return await keywordHandlers['Exchange']();
    }

    // Check for exact matches in regular responses
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (input === key) return response;
    }
    
    // Check for partial matches
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (input.includes(key)) return response;
    }
    
    // Default response if no match found
    return "I didn't catch that. I can assist with:\n\n- Game access and rules\n- NEAR/CRANS exchanges\n- Community features\n- Blockchain information\n\nWhat specific help do you need?";
  }

  return (
    <div className="w-full h-full max-h-[calc(100vh-56px-60px)] flex flex-col overflow-hidden p-2 md:p-4 box-border relative">
      <div className="w-full h-[calc(100vh-116px)] max-h-[calc(100vh-116px)] flex flex-col overflow-hidden border-none bg-gradient-to-br from-[rgba(8,35,17,0.92)] to-[rgba(0,32,0,0.95)] rounded-lg border border-[rgba(237,201,81,0.3)] shadow-[0_4px_16px_rgba(0,0,0,0.2),_0_0_24px_rgba(237,201,81,0.1)] backdrop-blur-[10px] p-3 md:p-5 box-border">
        <div id={messagesContainerId} className="flex-1 overflow-y-auto p-3 flex flex-col bg-[rgba(0,0,0,0.2)] min-h-0 max-h-[calc(100vh-220px)] w-full mb-4 rounded-lg border border-[rgba(237,201,81,0.15)] scrollbar-thin scrollbar-thumb-[rgba(237,201,81,0.3)] scrollbar-track-[rgba(0,0,0,0.1)] hover:scrollbar-thumb-[rgba(237,201,81,0.5)]">
          <div className="flex flex-col gap-2 h-auto w-full pb-2">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col w-full animate-[fadeIn_0.3s_ease-out] m-0 ${msg.role === 'user' ? 'self-end w-fit max-w-[85%]' : 'self-stretch w-full'}`}
              >
                <div className="bg-cover bg-center border border-[rgba(237,201,81,0.25)] rounded-lg overflow-hidden w-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] opacity-0 translate-y-[10px] animate-[slideIn_0.3s_ease-out_forwards] bg-gradient-to-br from-[rgba(0,0,0,0.3)] to-[rgba(0,32,0,0.3)]">
                  <div className="p-2 md:p-3 bg-[rgba(0,0,0,0.4)] border-b border-[rgba(237,201,81,0.25)] flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/${msg.role === 'user' ? wallet.accountId : 'warsofcards.near'}`}
                        alt={msg.role === 'user' ? truncateWalletName(wallet.accountId) : 'Vanessa'}
                        className={`w-8 h-8 rounded-full border-2 border-[rgb(237,201,81)] object-cover ${msg.role === 'user' && !wallet.accountId ? 'blur-[5px] opacity-70' : ''}`}
                      />
                      <span className="text-sm text-[rgb(237,201,81)] font-semibold text-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {msg.role === 'user' ? truncateWalletName(wallet.accountId) : 'Vanessa'}
                      </span>
                    </div>
                    <span className="text-xs text-[rgba(237,201,81,0.7)] ml-auto font-normal text-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className={`p-3 text-white leading-6 text-[0.95rem] text-shadow-[0_1px_1px_rgba(0,0,0,0.3)] ${msg.role === 'user' ? 'bg-[rgba(237,201,81,0.1)] font-medium shadow-[0_4px_15px_rgba(0,0,0,0.2),_0_2px_5px_rgba(237,201,81,0.1)]' : 'bg-[rgba(0,32,0,0.3)] font-normal shadow-[0_4px_15px_rgba(0,0,0,0.2),_0_2px_5px_rgba(237,201,81,0.1)]'}`}>
                    {msg.role === 'user' ? (
                      msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))
                    ) : (
                      <TypewriterText 
                        text={msg.content} 
                        speed={5}
                      />
                    )}
                    
                    {/* Add topic buttons at the end of Vanessa's last message */}
                    {msg.role === 'assistant' && 
                     msg.id === messages.filter(m => m.role === 'assistant').slice(-1)[0]?.id && 
                     !isLoading && (
                      <div className="flex flex-wrap gap-2 mt-4 justify-start">
                        {!wallet.accountId ? (
                          <>
                            <button
                              key="login"
                              className="px-3 py-2 bg-[rgba(237,201,81,0.4)] border-2 border-[rgba(237,201,81,0.7)] rounded-md text-[rgb(237,201,81)] text-sm cursor-pointer transition-all duration-200 whitespace-nowrap text-center font-semibold animate-[blinkingButton_2s_infinite]"
                              onClick={() => handleTopicClick('login')}
                            >
                              Log In
                            </button>
                            <button
                              key="help"
                              className="px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(237,201,81,0.7)] rounded-md text-[rgb(237,201,81)] text-sm cursor-pointer transition-all duration-200 whitespace-nowrap text-center hover:bg-[rgba(237,201,81,0.15)] hover:-translate-y-0.5 active:scale-[0.98]"
                              onClick={() => handleTopicClick('help')}
                            >
                              Help
                            </button>
                          </>
                        ) : (
                          mainTopics
                            .filter(topic => !usedTopics.includes(topic.id)) // Filter out used topics
                            .map((topic) => (
                            <button
                              key={topic.id}
                              className="px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(237,201,81,0.7)] rounded-md text-[rgb(237,201,81)] text-sm cursor-pointer transition-all duration-200 whitespace-nowrap text-center hover:bg-[rgba(237,201,81,0.15)] hover:-translate-y-0.5 active:scale-[0.98]"
                              onClick={() => handleTopicClick(topic.id)}
                            >
                              {topic.label}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex flex-col w-full animate-[fadeIn_0.3s_ease-out] m-0 self-stretch">
                <div className="bg-cover bg-center border border-[rgba(237,201,81,0.25)] rounded-lg overflow-hidden w-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] opacity-0 translate-y-[10px] animate-[slideIn_0.3s_ease-out_forwards] bg-gradient-to-br from-[rgba(0,0,0,0.3)] to-[rgba(0,32,0,0.3)]">
                  <div className="p-2 md:p-3 bg-[rgba(0,0,0,0.4)] border-b border-[rgba(237,201,81,0.25)] flex items-center gap-3">
                    <img 
                      src="https://i.near.social/magic/thumbnail/https://near.social/magic/img/account/warsofcards.near"
                      alt="Vanessa"
                      className="w-8 h-8 rounded-full border-2 border-[rgb(237,201,81)] object-cover"
                    />
                    <span className="text-sm text-[rgb(237,201,81)] font-semibold">Vanessa</span>
                  </div>
                  <div className="p-3 text-white leading-6 text-[0.95rem] bg-[rgba(0,32,0,0.3)] text-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                    <TypewriterText text="..." speed={500} />
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
            placeholder={wallet.accountId ? "Type command here..." : "Log in to perform actions..."}
            className="flex-1 p-3 px-4 rounded-md border border-[rgba(237,201,81,0.7)] bg-[rgba(0,0,0,0.4)] text-white text-[15px] resize-none font-inherit min-h-[40px] max-h-[80px] box-border focus:outline-none focus:border-[rgb(237,201,81)] placeholder:text-[rgba(255,255,255,0.5)]"
            rows={1}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()} 
            className="h-[40px] min-w-[80px] px-4 rounded-md border border-[rgb(237,201,81)] bg-[rgba(0,0,0,0.4)] text-[rgb(237,201,81)] cursor-pointer font-semibold text-[15px] flex items-center justify-center box-border transition-all duration-200 hover:bg-[rgb(237,201,81)] hover:text-[rgb(0,32,0)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
