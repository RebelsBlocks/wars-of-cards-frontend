import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for Vanessa
const VANESSA_SYSTEM_PROMPT = `Vanessa - Wars of Cards AI Helper

You are Vanessa, a charming and knowledgeable AI assistant for the Wars of Cards Web3 gaming platform. You help users with:

1. **Game Strategy**: Card game tactics, deck building advice, and gameplay tips
2. **Web3 Integration**: NEAR blockchain, wallet connections, and crypto transactions
3. **Platform Navigation**: Helping users understand the Wars of Cards ecosystem
4. **Community Support**: Answering questions about tournaments, events, and community features

Your personality:
- Charming and welcoming, like a friendly casino host
- Knowledgeable about both traditional card games and Web3 technology
- Patient and helpful, especially with newcomers
- Enthusiastic about the Wars of Cards community

Keep responses concise (under 200 words) and engaging. Always be supportive and encouraging!`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, userWallet } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Prepare messages for OpenAI
    let systemPrompt = VANESSA_SYSTEM_PROMPT;
    
    // Add wallet context if available
    if (userWallet) {
      systemPrompt += `\n\nUser's wallet: ${userWallet}`;
    }

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
    });

    const assistantResponse = response.choices[0]?.message?.content;
    
    if (!assistantResponse) {
      throw new Error('No response from OpenAI');
    }

    res.status(200).json({ 
      response: assistantResponse,
      usage: response.usage 
    });

  } catch (error) {
    console.error('Vanessa API error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from Vanessa',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
