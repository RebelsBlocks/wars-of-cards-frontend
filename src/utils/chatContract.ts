import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { getNetworkConfig } from '../contexts/NetworkContext';

// Get current network - always mainnet
const getCurrentNetworkId = () => {
  return 'mainnet' as const;
};

// Contract configuration - dynamically determined
export const getChatContractId = () => {
  const networkId = getCurrentNetworkId();
  return getNetworkConfig(networkId).chatContractId;
};

export const getRpcUrl = () => {
  const networkId = getCurrentNetworkId();
  return getNetworkConfig(networkId).nodeUrl;
};

// Helper function to format NEAR amounts - simplified version
export const formatNearAmount = (yoctoNear: string): string => {
  try {
    const yoctoNearBig = BigInt(yoctoNear);
    const nearAmount = Number(yoctoNearBig) / Math.pow(10, 24);
    return nearAmount.toFixed(4);
  } catch (error) {
    console.error('Error formatting NEAR amount:', error);
    return '0.0000';
  }
};

// Helper function to convert NEAR to yoctoNEAR  
export const parseNearAmount = (near: string): string => {
  try {
    // Clean the input - remove any whitespace
    const cleanNear = near.trim();
    
    // Convert using the same method as in the existing codebase
    // Split by decimal point to handle precision correctly
    const [wholePart, decimalPart = ''] = cleanNear.split('.');
    
    // Pad decimal part to 24 digits (yoctoNEAR precision)
    const paddedDecimal = decimalPart.padEnd(24, '0').slice(0, 24);
    
    // Combine whole and decimal parts
    const yoctoNearString = wholePart + paddedDecimal;
    
    // Remove leading zeros except for the last one
    const result = yoctoNearString.replace(/^0+/, '') || '0';
    
    return result;
  } catch (error) {
    console.error('Error parsing NEAR amount:', error);
    return '0';
  }
};

// Message type definition
export interface ChatMessage {
  account_id: string;
  message: string;
  timestamp: string;
  storage_paid: string;
}

// Storage balance functions - using wallet.viewFunction like in Brief.tsx
export const getStorageBalance = async (accountId: string, wallet: any): Promise<string> => {
  try {
    if (!wallet.selector) {
      return "0";
    }

    const contractId = getChatContractId();
    
    // Use wallet.viewFunction like in Brief.tsx and BettingScreen.tsx
    const result = await wallet.viewFunction({
      contractId: contractId,
      methodName: "get_storage_balance",
      args: { account_id: accountId }
    });

    return result || '0';
  } catch (error) {
    console.error('Error fetching storage balance for', accountId, ':', error);
    return '0';
  }
};

// Get messages function - using wallet.viewFunction
export const getMessages = async (wallet: any, limit: number = 100): Promise<ChatMessage[]> => {
  try {
    if (!wallet.selector) {
      return [];
    }

    const contractId = getChatContractId();
    
    // Use wallet.viewFunction like in Brief.tsx and BettingScreen.tsx
    // ✅ IMPORTANT: Contract expects limit as string, not number!
    const result = await wallet.viewFunction({
      contractId: contractId,
      methodName: "get_messages",
      args: { limit: limit.toString() }  // Convert number to string
    });

    return result || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// Helper function to format Unix timestamp to readable time
export const formatTimestamp = (unixTimestamp: string): string => {
  try {
    // Convert nanoseconds to milliseconds (NEAR uses nanoseconds)
    const timestampMs = parseInt(unixTimestamp) / 1000000;
    const date = new Date(timestampMs);
    
    // Format as HH:MM DD/MM/YYYY
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

// Add message function - using wallet.executeTransaction
export const addMessage = async (wallet: any, message: string): Promise<void> => {
  try {
    if (!wallet.selector) {
      throw new Error('No wallet selector available');
    }

    const contractId = getChatContractId();
    
    // Use wallet.executeTransaction for write operations
    await wallet.executeTransaction({
      contractId: contractId,
      methodName: "add_message_po_chatter",
      args: { message: message },
      gas: '30000000000000',
      deposit: '0',
      onSuccess: () => {
        // Success callback - no logging needed
      }
    });
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
};

// Simple object to replace the old chatContract class - now requires wallet
export const chatContract = {
  getStorageBalance,
  getMessages,
  addMessage,
  updateNetwork: () => {
    // Network updates are now handled by getRpcUrl() dynamically
    // No logging needed
  }
};
