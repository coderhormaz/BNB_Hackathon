import { GoogleGenerativeAI } from "@google/generative-ai";

// Types for structured blockchain actions
export interface BlockchainAction {
  action: 'create_token' | 'mint_nft' | 'upload_nft' | 'send_transaction' | 'check_balance' | 'get_transactions' | 'unknown';
  confidence: number;
  details: {
    [key: string]: any;
  };
  missingFields: string[];
  isComplete: boolean;
}

export interface TokenCreationDetails {
  name?: string;
  symbol?: string;
  totalSupply?: string;
  decimals?: string;
}

export interface NFTMintingDetails {
  name?: string;
  description?: string;
  imageUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface TransactionDetails {
  recipient?: string;
  amount?: string;
  token?: string; // 'BNB' or token address
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  // Main method to process user input and extract blockchain actions
  async processUserInput(input: string, conversationContext: any[] = []): Promise<{
    response: string;
    action: BlockchainAction | null;
    requiresConfirmation: boolean;
  }> {
    try {
      const prompt = this.buildPrompt(input, conversationContext);
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the AI response to extract structured data
      const parsedResponse = this.parseAIResponse(text);
      
      return parsedResponse;
    } catch (error) {
      console.error('Gemini AI Error:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        action: null,
        requiresConfirmation: false
      };
    }
  }

  // Build the system prompt for Gemini
  private buildPrompt(userInput: string, context: any[]): string {
    const systemPrompt = `
You are an opBNB AI Assistant specialized in blockchain operations. Your role is to:

1. Understand natural language requests for blockchain actions
2. Extract structured data from user requests
3. Ask for missing information when needed
4. Provide confirmation messages before executing actions

SUPPORTED ACTIONS:
- create_token: Create BEP-20 tokens (AI will auto-fill intelligent defaults based on user request)
- mint_nft: Mint NFTs (requires: name, description, optional: attributes). For image, always use upload_nft first.
- upload_nft: Show upload button for NFT image upload to BNB Greenfield (no additional details required)
- send_transaction: Send BNB or tokens (requires: recipient, amount, token type)
- check_balance: Check wallet balance
- get_transactions: Get transaction history

TOKEN CREATION AI INTELLIGENCE:
When user requests to create a token, you should intelligently determine:
- name: Extract from user request or suggest based on context
- symbol: Generate 3-4 letter symbol from name (e.g., "My Coin" -> "MYCN", "Gaming Token" -> "GAME") 
- totalSupply: Smart defaults based on token type, but users can specify ANY amount:
  * Utility tokens: 100,000,000 (100M)
  * Gaming tokens: 1,000,000,000 (1B) 
  * Meme coins: 1,000,000,000,000 (1T)
  * Governance tokens: 10,000,000 (10M)
  * Stablecoins: 1,000,000 (1M)
  * Default: 1,000,000 (1M)
  * Users can override with ANY amount (no limits!)
- decimals: Always default to 18 (standard for BEP-20)

EXAMPLES:
User: "Create a gaming token called Dragon Quest Token"
AI Response: name="Dragon Quest Token", symbol="DQT", totalSupply=1000000000, decimals=18

User: "I want to make a meme coin named PEPE2 with 100 trillion supply"  
AI Response: name="PEPE2", symbol="PEPE2", totalSupply=100000000000000, decimals=18

User: "Create a utility token for my app called AppCoin with 50 million supply"
AI Response: name="AppCoin", symbol="APP", totalSupply=50000000, decimals=18

RESPONSE FORMAT:
You must respond in this JSON structure wrapped in markdown code blocks:

\`\`\`json
{
  "response": "Your conversational response to the user",
  "action": {
    "action": "create_token|mint_nft|send_transaction|check_balance|get_transactions|unknown",
    "confidence": 0.95,
    "details": {
      "name": "extracted name",
      "symbol": "extracted symbol",
      // ... other relevant fields
    },
    "missingFields": ["field1", "field2"],
    "isComplete": false
  },
  "requiresConfirmation": false
}
\`\`\`

RULES:
1. Always extract available information from user input
2. For create_token: If you have name, symbol, and totalSupply, proceed to confirmation (decimals will be set to 18 automatically)
3. If information is missing, ask for it conversationally
4. When all required fields are complete, ask for confirmation
5. Be helpful and friendly
6. If the request is unclear, ask for clarification

IMPORTANT: For token creation, ONLY name, symbol, and totalSupply are required. Do NOT ask for decimals as it defaults to 18.

EXAMPLES:
User: "Create a token called DogeCoin"
Response: Extract action=create_token, name=DogeCoin, ask for symbol and supply (decimals will default to 18 automatically)

User: "Upload NFT" or "I want to upload an image for NFT"
Response: Extract action=upload_nft, show upload button immediately - do NOT ask for details yet

User: "Create an NFT" or "Mint NFT" or "I want to make an NFT"
Response: Extract action=upload_nft, suggest they upload an image first - do NOT ask for name/description yet

User: "create a nft called hormaz description nothing"
Response: Extract action=upload_nft, suggest they upload an image first - details can be processed after upload

User: "name hormaz symbol ho supply 9900"
Response: Extract action=create_token, name=Hormaz, symbol=HO, totalSupply=9900, decimals=18, ask for confirmation - DO NOT ask for more info

User: "Send 2 BNB to 0x123..."
Response: Extract action=send_transaction, amount=2, token=BNB, recipient=0x123..., ask for confirmation

User: "transfer 0.5 bnb to 0xabc..." or "send 1 BNB to my friend 0xdef..."
Response: Extract action=send_transaction, amount=0.5, token=BNB, recipient=0xabc..., ask for confirmation

User: "send 100 USDT to 0x456..." (with token address)
Response: Extract action=send_transaction, amount=100, token=0x55d398326f99059ff775485246999027b3197955, recipient=0x456..., ask for confirmation

Current conversation context: ${JSON.stringify(context)}

User input: "${userInput}"

Please analyze this request and respond with the JSON structure.`;

    return systemPrompt;
  }

  // Parse AI response and extract structured data
  private parseAIResponse(aiResponse: string): {
    response: string;
    action: BlockchainAction | null;
    requiresConfirmation: boolean;
  } {
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        // Fallback to plain response if no JSON structure found
        return {
          response: aiResponse,
          action: null,
          requiresConfirmation: false
        };
      }

      const parsedJson = JSON.parse(jsonMatch[1]);
      
      // Set default values for token creation with AI intelligence
      if (parsedJson.action?.action === 'create_token') {
        const tokenDetails = parsedJson.action.details;
        
        // AI-generated intelligent defaults
        if (!tokenDetails.decimals) {
          tokenDetails.decimals = '18'; // Always 18 for BEP-20 standard
        }
        
        // Smart total supply based on token name/type
        if (!tokenDetails.totalSupply) {
          tokenDetails.totalSupply = this.generateSmartTotalSupply(tokenDetails.name || '');
        }
        
        // Auto-generate symbol if missing
        if (!tokenDetails.symbol && tokenDetails.name) {
          tokenDetails.symbol = this.generateTokenSymbol(tokenDetails.name);
        }
      }
      
      // Validation for send_transaction
      if (parsedJson.action?.action === 'send_transaction') {
        const txDetails = parsedJson.action.details;
        
        // Set default token to BNB if not specified
        if (!txDetails.token || txDetails.token === '') {
          txDetails.token = 'BNB';
        }
        
        // Validate required fields
        const missingFields = [];
        if (!txDetails.recipient) missingFields.push('recipient');
        if (!txDetails.amount) missingFields.push('amount');
        
        parsedJson.action.missingFields = missingFields;
        parsedJson.action.isComplete = missingFields.length === 0;
        
        console.log('🔍 Send transaction validation:', {
          recipient: txDetails.recipient,
          amount: txDetails.amount,
          token: txDetails.token,
          missingFields,
          isComplete: parsedJson.action.isComplete
        });
      }
      
      // Special handling for upload_nft - always complete
      if (parsedJson.action?.action === 'upload_nft') {
        parsedJson.action.isComplete = true;
        parsedJson.requiresConfirmation = true; // This triggers the special upload handling
      }      return {
        response: parsedJson.response || aiResponse,
        action: parsedJson.action || null,
        requiresConfirmation: parsedJson.requiresConfirmation || false
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        response: aiResponse,
        action: null,
        requiresConfirmation: false
      };
    }
  }

  // Generate confirmation message for an action
  async generateConfirmationMessage(action: BlockchainAction): Promise<string> {
    // Import blockchain service for gas estimation
    const { BlockchainService } = await import('./blockchainService');
    
    switch (action.action) {
      case 'create_token': {
        const tokenDetails = action.details as TokenCreationDetails;
        const tokenGasEstimate = await BlockchainService.estimateGas('token');
        const tokenGasCostUSD = await BlockchainService.getGasCostUSD('token');
        
        return `🪙 **Token Creation Confirmation**

You're about to create a BEP-20 token with these details:
• **Name**: ${tokenDetails.name}
• **Symbol**: ${tokenDetails.symbol}
• **Total Supply**: ${parseInt(tokenDetails.totalSupply || '0').toLocaleString()}
• **Decimals**: ${tokenDetails.decimals}

💰 **Estimated Gas Cost**: ~${tokenGasEstimate} BNB (${tokenGasCostUSD})
🔗 **Network**: opBNB Mainnet

This will deploy a new smart contract on opBNB. The contract will be automatically verified.

**Should I proceed with creating this token?** (Yes/No)`;
      }

      case 'upload_nft':
        return `📤 **NFT Upload Ready**

I'll help you upload your image to BNB Greenfield and mint it as an NFT!

**Here's what will happen:**
1. You'll upload your image to BNB Greenfield (decentralized storage)
2. I'll ask for NFT name and description
3. We'll mint the NFT on opBNB with your image

**Ready to start?** Click the upload button below!`;

      case 'mint_nft': {
        const nftDetails = action.details as NFTMintingDetails;
        const nftGasEstimate = await BlockchainService.estimateGas('nft');
        const nftGasCostUSD = await BlockchainService.getGasCostUSD('nft');
        
        return `🖼️ **NFT Minting Confirmation**

You're about to mint an NFT with these details:
• **Name**: ${nftDetails.name}
• **Description**: ${nftDetails.description}
• **Image**: ${nftDetails.imageUrl ? 'Provided' : 'Not provided'}
${nftDetails.attributes ? `• **Attributes**: ${nftDetails.attributes.length} traits` : ''}

💰 **Estimated Gas Cost**: ~${nftGasEstimate} BNB (${nftGasCostUSD})
🔗 **Network**: opBNB Mainnet

Metadata will be stored on-chain. The NFT will be minted to your wallet.

**Should I proceed with minting this NFT?** (Yes/No)`;
      }

      case 'send_transaction': {
        const txDetails = action.details as TransactionDetails;
        const transferGasEstimate = await BlockchainService.estimateGas('transfer');
        const transferGasCostUSD = await BlockchainService.getGasCostUSD('transfer');
        
        return `💸 **Transaction Confirmation**

You're about to send:
• **Amount**: ${txDetails.amount} ${txDetails.token || 'BNB'}
• **To**: \`${txDetails.recipient}\`
• **From**: Your connected wallet

💰 **Estimated Gas Cost**: ~${transferGasEstimate} BNB (${transferGasCostUSD})
🔗 **Network**: opBNB Mainnet

This transaction cannot be reversed once confirmed.

**Should I proceed with this transfer?** (Yes/No)`;
      }
      default:
        return `**Confirmation Required**

Please confirm you want to proceed with this action.

**Should I continue?** (Yes/No)`;
    }
  }

  // AI-powered token parameter generation
  private generateSmartTotalSupply(tokenName: string): string {
    const name = tokenName.toLowerCase();
    
    // Gaming tokens
    if (name.includes('game') || name.includes('gaming') || name.includes('play') || 
        name.includes('quest') || name.includes('rpg') || name.includes('nft')) {
      return '1000000000'; // 1 billion
    }
    
    // Meme coins
    if (name.includes('meme') || name.includes('pepe') || name.includes('doge') || 
        name.includes('shib') || name.includes('moon') || name.includes('rocket')) {
      return '1000000000000'; // 1 trillion
    }
    
    // Governance tokens
    if (name.includes('govern') || name.includes('vote') || name.includes('dao') || 
        name.includes('council') || name.includes('proposal')) {
      return '10000000'; // 10 million
    }
    
    // Utility tokens
    if (name.includes('utility') || name.includes('app') || name.includes('platform') || 
        name.includes('service') || name.includes('network')) {
      return '100000000'; // 100 million
    }
    
    // Stablecoins
    if (name.includes('stable') || name.includes('usd') || name.includes('dollar') || 
        name.includes('peg')) {
      return '1000000'; // 1 million
    }
    
    // Default for general tokens
    return '1000000'; // 1 million
  }

  private generateTokenSymbol(tokenName: string): string {
    // Remove common words and extract meaningful parts
    const cleanName = tokenName.replace(/\b(token|coin|currency|crypto|digital|blockchain)\b/gi, '').trim();
    const words = cleanName.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return 'TKN'; // Fallback
    }
    
    if (words.length === 1) {
      // Single word: take first 3-4 characters
      const word = words[0].toUpperCase();
      return word.length > 4 ? word.substring(0, 4) : word;
    }
    
    if (words.length === 2) {
      // Two words: take first 2-3 chars of each
      const first = words[0].toUpperCase();
      const second = words[1].toUpperCase();
      return (first.substring(0, 2) + second.substring(0, 2)).substring(0, 4);
    }
    
    // Multiple words: take first char of each word, up to 4 chars
    const acronym = words.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 4);
    return acronym.length < 3 ? acronym + 'N' : acronym; // Ensure at least 3 chars
  }
}

export const geminiAI = new GeminiAIService();
