import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConversationStore } from '../../store/conversationStore';
import { geminiAI } from '../../services/geminiAI';
import { UploadButton, ImagePreview } from '../UploadButton';
import MessageRenderer from '../MessageRenderer';

const AIChat: React.FC = () => {
  const { 
    messages, 
    pendingAction, 
    isProcessing, 
    addMessage, 
    setPendingAction, 
    setProcessing,
    confirmAction,
    rejectAction,
    clearConversation
  } = useConversationStore();
  
  const [inputValue, setInputValue] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{url: string, fileName: string} | null>(null);
  const [isWaitingForNFTDetails, setIsWaitingForNFTDetails] = useState(false);
  const [pendingNFTDetails, setPendingNFTDetails] = useState<{name?: string, description?: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userInput = inputValue.trim();
    setInputValue('');

    // Add user message
    addMessage({
      type: 'user',
      content: userInput
    });

    // Check if this is a confirmation response
    if (pendingAction?.isWaitingForConfirmation) {
      await handleConfirmationResponse(userInput);
      return;
    }

    // Check if we're waiting for NFT details after upload
    if (isWaitingForNFTDetails) {
      await handleNFTDetailsAfterUpload(userInput);
      return;
    }

    // Process with Gemini AI
    setProcessing(true);
    
    try {
      const conversationContext = messages.slice(-10); // Last 10 messages for context
      const result = await geminiAI.processUserInput(userInput, conversationContext);
      console.log('AI Result:', result); // Debug log

      // Handle special upload_nft action first
      if (result.action && result.action.action === 'upload_nft' && result.action.isComplete && result.requiresConfirmation) {
        // Store NFT details from the action for later use
        if (result.action.details) {
          setPendingNFTDetails({
            name: result.action.details.name,
            description: result.action.details.description
          });
        }
        
        addMessage({
          type: 'ai',
          content: result.response,
          action: result.action,
          showUpload: true,
          requiresConfirmation: false
        });
        return;
      }

      // Add AI response for other cases
      const aiMessage = {
        type: 'ai' as const,
        content: result.response,
        action: result.action || undefined,
        requiresConfirmation: result.requiresConfirmation
      };

      addMessage(aiMessage);

      // Handle confirmation flow for other actions
      if (result.action && result.action.isComplete && result.requiresConfirmation) {
        
        // Generate confirmation message (now async)
        try {
          const confirmationMessage = await geminiAI.generateConfirmationMessage(result.action);
          
          addMessage({
            type: 'ai',
            content: confirmationMessage
          });

          setPendingAction({
            action: result.action,
            messageId: Date.now().toString(),
            isWaitingForConfirmation: true
          });
        } catch (error) {
          console.error('Error generating confirmation message:', error);
          addMessage({
            type: 'ai',
            content: 'Error generating confirmation. Please try again.'
          });
        }
      }

    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please check your internet connection and try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmationResponse = async (input: string) => {
    const normalizedInput = input.toLowerCase().trim();
    
    if (['yes', 'y', 'confirm', 'proceed', 'ok', 'sure'].includes(normalizedInput)) {
      // User confirmed - execute the action
      try {
        setProcessing(true);
        await confirmAction(); // This now handles the blockchain execution
        // The confirmAction method will add success/failure messages automatically
      } catch (error) {
        console.error('Error executing action:', error);
        addMessage({
          type: 'ai',
          content: `❌ **Execution Failed**

An error occurred while executing the blockchain transaction. Please try again.`
        });
      } finally {
        setProcessing(false);
      }
    } else if (['no', 'n', 'cancel', 'abort', 'stop'].includes(normalizedInput)) {
      // User rejected
      rejectAction();
      addMessage({
        type: 'ai',
        content: `❌ **Action Cancelled**

No problem! The action has been cancelled. Is there something else I can help you with?`
      });
    } else {
      // Unclear response, ask again
      addMessage({
        type: 'ai',
        content: `I didn't understand your response. Please reply with **"Yes"** to confirm or **"No"** to cancel the action.`
      });
    }
  };

  // Handle image upload completion
  const handleUploadComplete = async (url: string, fileName: string) => {
    setUploadedImage({ url, fileName });
    
    // Check if we already have NFT details from the original request
    if (pendingNFTDetails && (pendingNFTDetails.name || pendingNFTDetails.description)) {
      // We have details - proceed directly to confirmation
      const name = pendingNFTDetails.name || 'Untitled NFT';
      const description = pendingNFTDetails.description || `NFT created with opBNB AI Assistant`;

      // Create NFT action with uploaded image
      const nftAction = {
        action: 'mint_nft' as const,
        confidence: 0.95,
        details: {
          name: name,
          description: description,
          imageUrl: url,
          attributes: []
        },
        missingFields: [],
        isComplete: true
      };

      try {
        // Generate confirmation
        const confirmationMessage = await geminiAI.generateConfirmationMessage(nftAction);
        
        addMessage({
          type: 'ai',
          content: `🎉 **Image uploaded successfully to BNB Greenfield!**

Your image "${fileName}" has been stored on the decentralized network.

${confirmationMessage}`,
          uploadedImage: { url, fileName }
        });

        setPendingAction({
          action: nftAction,
          messageId: Date.now().toString(),
          isWaitingForConfirmation: true
        });

        // Clear pending NFT details
        setPendingNFTDetails(null);
      } catch (error) {
        console.error('Error generating confirmation message:', error);
        addMessage({
          type: 'ai',
          content: `🎉 **Image uploaded successfully!** 

Your image "${fileName}" has been stored on BNB Greenfield. There was an error generating the confirmation. Please try again.`,
          uploadedImage: { url, fileName }
        });
      }
    } else {
      // No details available - ask for them
      setIsWaitingForNFTDetails(true);
      
      addMessage({
        type: 'ai',
        content: `🎉 **Image uploaded successfully to BNB Greenfield!**

Your image has been stored on the decentralized network. Now I need a few more details to mint your NFT:

📝 **Please provide:**
1. **NFT Name** - What should your NFT be called?
2. **Description** - Tell me about your NFT (optional)

You can provide both in one message like: "Name: My Art, Description: Beautiful digital artwork"`,
        uploadedImage: { url, fileName }
      });
    }
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    addMessage({
      type: 'ai',
      content: `❌ **Upload Failed**

${error}

Please try again with a different image or check your internet connection.`
    });
  };

  // Handle NFT details after upload
  const handleNFTDetailsAfterUpload = async (userInput: string) => {
    if (!uploadedImage) return;

    try {
      let name = '';
      let description = '';

      // Parse different input formats
      if (userInput.toLowerCase().includes('create') && userInput.toLowerCase().includes('nft')) {
        // Format: "create a nft called NAME description DESCRIPTION"
        const calledMatch = userInput.match(/called\s+([^,\n]+?)(?:\s+description\s+(.+))?$/i);
        if (calledMatch) {
          name = calledMatch[1].trim();
          description = calledMatch[2]?.trim() || '';
          if (description.toLowerCase() === 'nothing') description = '';
        }
      } else if (userInput.match(/name:\s*([^,\n]+)/i)) {
        // Format: "name: NAME, description: DESCRIPTION"
        const nameMatch = userInput.match(/name:\s*([^,\n]+)/i);
        const descriptionMatch = userInput.match(/description:\s*([^,\n]+)/i);
        name = nameMatch?.[1]?.trim() || '';
        description = descriptionMatch?.[1]?.trim() || '';
      } else if (userInput.toLowerCase().includes('confirm') || 
                 userInput.toLowerCase().includes('mint') ||
                 userInput.toLowerCase().includes('proceed')) {
        // User wants to proceed without more details
        addMessage({
          type: 'ai',
          content: `I need at least a name for your NFT. Please tell me what to call it, like: "Name it Digital Art"`
        });
        return;
      } else if (userInput.toLowerCase().includes('skip') ||
                 userInput.toLowerCase().includes('no description') ||
                 userInput.toLowerCase() === 'no') {
        // User is skipping description, but we still need a name
        addMessage({
          type: 'ai',
          content: `What would you like to name your NFT? For example: "Call it My Artwork"`
        });
        return;
      } else if (userInput.length < 50 && !userInput.includes(',')) {
        // Likely just a name
        name = userInput.trim();
        description = '';
      }

      if (!name) {
        addMessage({
          type: 'ai',
          content: `I need a name for your NFT. Please say something like: "Name it Hormaz" or "Call it Digital Art"`
        });
        return;
      }

      // Create NFT action with uploaded image
      const nftAction = {
        action: 'mint_nft' as const,
        confidence: 0.95,
        details: {
          name: name,
          description: description || `NFT created with opBNB AI Assistant`,
          imageUrl: uploadedImage.url,
          attributes: []
        },
        missingFields: [],
        isComplete: true
      };

      // Generate confirmation
      const confirmationMessage = await geminiAI.generateConfirmationMessage(nftAction);
      
      addMessage({
        type: 'ai',
        content: confirmationMessage
      });

      setPendingAction({
        action: nftAction,
        messageId: Date.now().toString(),
        isWaitingForConfirmation: true
      });

      setIsWaitingForNFTDetails(false);
    } catch (error) {
      console.error('Error processing NFT details:', error);
      addMessage({
        type: 'ai',
        content: 'Error processing NFT details. Please try again.'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    clearConversation();
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span>
          <h2>opBNB AI Assistant</h2>
          <span className="gemini-badge">Powered by Gemini</span>
        </div>
        <div className="chat-actions">
          <div className="chat-status">
            <div className="status-dot"></div>
            <span>Online</span>
          </div>
          <motion.button
            className="clear-chat-btn"
            onClick={handleClearChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Clear Chat
          </motion.button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`message ${message.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="message-content">
              <MessageRenderer content={message.content} />
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            {message.action && (
              <div className="message-action-badge">
                Action: {message.action.action}
              </div>
            )}
            {message.showUpload && (
              <UploadButton
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            )}
            {message.uploadedImage && (
              <ImagePreview
                url={message.uploadedImage.url}
                fileName={message.uploadedImage.fileName}
              />
            )}
          </motion.div>
        ))}
        
        {isProcessing && (
          <motion.div
            className="message ai typing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="typing-text">Gemini AI is thinking...</div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {pendingAction?.isWaitingForConfirmation && (
          <div className="confirmation-banner">
            <span>⏳ Waiting for your confirmation (Yes/No)</span>
          </div>
        )}
        <div className="chat-input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              pendingAction?.isWaitingForConfirmation 
                ? "Type 'Yes' to confirm or 'No' to cancel..." 
                : "Ask me to create tokens, mint NFTs, send BNB, or check your wallet..."
            }
            className="chat-input"
            rows={1}
            disabled={isProcessing}
          />
          <motion.button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{isProcessing ? 'Processing...' : 'Send'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 12L22 2L13 22L11 13L2 12Z"/>
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
