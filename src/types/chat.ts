export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Contract types based on chatter_abi.json
export interface ChatMessage {
  account_id: string;   // AccountId from contract
  message: string;      // Message content
  timestamp: string;    // U64 timestamp as string
  storage_paid: string; // U128 storage cost as string
} 