import { ethers } from 'ethers';
import type { TokenCreationDetails, NFTMintingDetails, TransactionDetails } from './geminiAI';
import { PriceService } from './priceService';

// Smart Contract ABIs (optimized versions)
const OPTIMIZED_TOKEN_FACTORY_ABI = [
  "function createToken(string name, string symbol, uint96 totalSupply, uint8 decimals) external returns (address)",
  "function getCreatedTokens(address creator) external view returns (address[])",
  "function getTotalTokensCount() external view returns (uint256)"
];

const OPTIMIZED_NFT_FACTORY_ABI = [
  "function mintNFT(address to, string memory uri, string memory name, string memory description) external payable returns (uint256)",
  "function batchMintNFT(address[] memory recipients, string[] memory uris, string[] memory names, string[] memory descriptions) external payable returns (uint256[])",
  "function getNFTInfo(uint256 tokenId) external view returns (tuple(address creator, uint96 timestamp, string name, string description, string tokenURI))",
  "function getTotalNFTs() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function paused() external view returns (bool)"
];

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  contractAddress?: string;
  tokenId?: string;
  explorerUrl?: string;
}

export class BlockchainService {
  private static getContractAddresses() {
    return {
      tokenFactory: import.meta.env.VITE_TOKEN_FACTORY_CONTRACT,
      nftFactory: import.meta.env.VITE_NFT_FACTORY_CONTRACT,
      paymentContract: import.meta.env.VITE_PAYMENT_CONTRACT,
    };
  }

  private static getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = import.meta.env.VITE_OPBNB_RPC_URL || 'https://opbnb-mainnet-rpc.bnbchain.org';
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  private static getExplorerUrl(hash: string): string {
    const explorer = import.meta.env.VITE_OPBNB_EXPLORER || 'https://opbnbscan.com';
    return `${explorer}/tx/${hash}`;
  }

  // Create BEP-20 Token
  static async createToken(
    tokenDetails: TokenCreationDetails,
    privateKey: string
  ): Promise<TransactionResult> {
    try {
      console.log('Creating token:', tokenDetails);
      
      const provider = this.getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const addresses = this.getContractAddresses();

      if (!addresses.tokenFactory) {
        throw new Error('Token factory contract address not configured');
      }

      const contract = new ethers.Contract(addresses.tokenFactory, OPTIMIZED_TOKEN_FACTORY_ABI, wallet);

      // Convert totalSupply to uint96 format for optimized contract
      const totalSupplyValue = tokenDetails.totalSupply || '1000000';
      // Remove artificial limit - let users create any supply amount they want
      const uint96TotalSupply = Number(totalSupplyValue);

      const tx = await contract.createToken(
        tokenDetails.name,
        tokenDetails.symbol,
        uint96TotalSupply, // Use uint96 instead of full uint256
        parseInt(tokenDetails.decimals || '18')
      );

      console.log('Token creation transaction sent:', tx.hash);
      const receipt = await tx.wait();

      return {
        success: true,
        hash: tx.hash,
        explorerUrl: this.getExplorerUrl(tx.hash),
        contractAddress: receipt.logs[0]?.address // Token contract address from logs
      };
    } catch (error) {
      console.error('Token creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token creation failed'
      };
    }
  }

  // Mint NFT
  static async mintNFT(
    nftDetails: NFTMintingDetails,
    recipientAddress: string,
    privateKey: string
  ): Promise<TransactionResult> {
    try {
      console.log('Minting NFT:', nftDetails);
      console.log('Recipient:', recipientAddress);
      
      const provider = this.getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const addresses = this.getContractAddresses();

      if (!addresses.nftFactory) {
        throw new Error('NFT factory contract address not configured');
      }

      console.log('Using NFT Factory address:', addresses.nftFactory);

      // Check if contract exists at address
      const contractCode = await provider.getCode(addresses.nftFactory);
      console.log('Contract code length:', contractCode.length);
      if (contractCode === '0x') {
        throw new Error(`No contract found at address ${addresses.nftFactory}. Contract may not be deployed.`);
      }

      const contract = new ethers.Contract(addresses.nftFactory, OPTIMIZED_NFT_FACTORY_ABI, wallet);

      // Try to call a view function to verify the contract interface
      try {
        console.log('Verifying contract interface by calling getTotalNFTs...');
        const totalNFTs = await contract.getTotalNFTs();
        console.log('Contract verification successful. Total NFTs:', totalNFTs.toString());
        
        // Additional contract diagnostics
        try {
          const owner = await contract.owner();
          console.log('Contract owner:', owner);
          console.log('Your wallet:', wallet.address);
          console.log('Are you the owner?', owner.toLowerCase() === wallet.address.toLowerCase());
        } catch {
          console.log('Could not get contract owner (function may not exist)');
        }
        
        try {
          const paused = await contract.paused();
          console.log('Contract paused status:', paused);
          if (paused) {
            throw new Error('Contract is currently paused and cannot mint NFTs.');
          }
        } catch {
          console.log('Could not get paused status (function may not exist)');
        }
        
      } catch (interfaceError) {
        console.error('Contract interface verification failed:', interfaceError);
        throw new Error(`Contract at ${addresses.nftFactory} exists but doesn't have the expected interface. The contract may not be an NFT factory or may have a different ABI.`);
      }

      // Check wallet balance
      const balance = await provider.getBalance(wallet.address);
      console.log('Wallet balance:', ethers.formatEther(balance), 'BNB');
      
      // Check if we have enough for gas + potential payment
      const minRequiredForGas = ethers.parseEther('0.00001');
      const potentialPayment = ethers.parseEther('0.01');
      const minRequiredTotal = minRequiredForGas + potentialPayment;
      
      if (balance < minRequiredForGas) {
        throw new Error('Insufficient BNB balance for gas fees. Need at least 0.00001 BNB (~$0.009).');
      }
      
      if (balance < minRequiredTotal) {
        console.warn(`⚠️ Wallet balance (${ethers.formatEther(balance)} BNB) may not be enough for payment + gas. Will try without payment first.`);
      }

      // Create metadata JSON
      const metadata = {
        name: nftDetails.name,
        description: nftDetails.description,
        image: nftDetails.imageUrl, // This will be the Greenfield URL
        attributes: nftDetails.attributes || [],
        external_url: nftDetails.imageUrl,
        animation_url: null,
        background_color: "000000"
      };

      // For production, upload metadata to IPFS or Greenfield as well
      // For now, we'll use a data URI
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      
      console.log('Token URI length:', tokenURI.length);
      console.log('Token URI first 200 chars:', tokenURI.substring(0, 200));
      console.log('Token URI type:', typeof tokenURI);
      console.log('Recipient address:', recipientAddress);
      console.log('Recipient address type:', typeof recipientAddress);
      console.log('NFT name:', JSON.stringify(nftDetails.name));
      console.log('NFT description:', JSON.stringify(nftDetails.description));

      // Validate parameters before attempting contract call
      if (!recipientAddress || typeof recipientAddress !== 'string') {
        throw new Error('Invalid recipient address: must be a non-empty string');
      }
      
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error(`Invalid recipient address format: ${recipientAddress}. Must be a valid Ethereum address.`);
      }
      
      if (!nftDetails.name || nftDetails.name.trim() === '') {
        throw new Error('NFT name cannot be empty');
      }
      
      if (!nftDetails.description || nftDetails.description.trim() === '') {
        throw new Error('NFT description cannot be empty');
      }
      
      if (!tokenURI || tokenURI.length === 0) {
        throw new Error('Token URI cannot be empty');
      }

      console.log('✅ All parameters validated successfully');
      console.log('Wallet address attempting mint:', wallet.address);
      console.log('Calling mintNFT with params:', {
        to: recipientAddress,
        uri: tokenURI.substring(0, 100) + '...', // Truncated for logging
        name: nftDetails.name,
        description: nftDetails.description
      });

      // Check if recipient and wallet address are the same
      if (recipientAddress.toLowerCase() !== wallet.address.toLowerCase()) {
        console.warn('⚠️  Recipient address differs from wallet address');
        console.log('Wallet:', wallet.address);
        console.log('Recipient:', recipientAddress);
      }

      // Estimate gas first with smart payment detection
      let gasEstimate: bigint;
      let requiresPayment = false;
      let paymentAmount = ethers.parseEther('0.01');
      
      try {
        console.log('Attempting gas estimation...');
        
        // First, let's try a test call with minimal data to see what happens
        try {
          console.log('🔬 Testing contract call with minimal parameters...');
          const testResult = await contract.mintNFT.staticCall(
            recipientAddress,
            "test",
            "test",
            "test"
          );
          console.log('✅ Static call successful, would return tokenId:', testResult.toString());
        } catch (staticError) {
          console.log('❌ Static call failed:', staticError);
          
          // If static call fails, the function might require payment
          try {
            console.log('🔬 Testing static call with payment...');
            const testResultWithPayment = await contract.mintNFT.staticCall(
              recipientAddress,
              "test", 
              "test",
              "test",
              { value: ethers.parseEther('0.001') }
            );
            console.log('✅ Static call with payment successful, would return tokenId:', testResultWithPayment.toString());
            console.log('💡 Contract requires payment for minting');
          } catch (staticPaymentError) {
            console.log('❌ Static call with payment also failed:', staticPaymentError);
          }
        }
        
        // Try gas estimation without payment first
        try {
          gasEstimate = await contract.mintNFT.estimateGas(
            recipientAddress,
            tokenURI,
            nftDetails.name,
            nftDetails.description
          );
          console.log('✅ Gas estimation successful without payment:', gasEstimate.toString());
        } catch (noPaymentError) {
          console.log('❌ Gas estimation failed without payment, checking if we have enough for payment...');
          
          // Check if we have enough balance for payment + gas
          if (balance >= paymentAmount + ethers.parseEther('0.0001')) {
            console.log('💰 Trying with payment since we have enough balance...');
            
            // Try with payment (0.01 BNB)
            gasEstimate = await contract.mintNFT.estimateGas(
              recipientAddress,
              tokenURI,
              nftDetails.name,
              nftDetails.description,
              { value: paymentAmount }
            );
            
            requiresPayment = true;
            console.log('✅ Gas estimation successful with payment of 0.01 BNB:', gasEstimate.toString());
          } else {
            console.log('💸 Insufficient balance for payment, trying smaller amounts...');
            
            // Try with smaller payments
            const smallerPayments = [
              ethers.parseEther('0.001'), // 0.001 BNB
              ethers.parseEther('0.0001'), // 0.0001 BNB
              ethers.parseEther('0.00001') // 0.00001 BNB
            ];
            
            let paymentFound = false;
            for (const smallPayment of smallerPayments) {
              if (balance >= smallPayment + ethers.parseEther('0.0001')) {
                try {
                  gasEstimate = await contract.mintNFT.estimateGas(
                    recipientAddress,
                    tokenURI,
                    nftDetails.name,
                    nftDetails.description,
                    { value: smallPayment }
                  );
                  
                  requiresPayment = true;
                  paymentAmount = smallPayment;
                  console.log(`✅ Gas estimation successful with payment of ${ethers.formatEther(smallPayment)} BNB:`, gasEstimate.toString());
                  paymentFound = true;
                  break;
                } catch {
                  console.log(`❌ Payment of ${ethers.formatEther(smallPayment)} BNB failed`);
                }
              }
            }
            
            if (!paymentFound) {
              throw noPaymentError; // Re-throw original error
            }
          }
        }
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        
        // Type-safe error handling
        const errorInfo = gasError as { code?: string; reason?: string; data?: unknown; error?: unknown };
        console.error('Gas error details:', {
          message: gasError instanceof Error ? gasError.message : 'Unknown error',
          code: errorInfo.code,
          reason: errorInfo.reason,
          data: errorInfo.data,
          error: errorInfo.error,
          stack: gasError instanceof Error ? gasError.stack : undefined,
          fullError: JSON.stringify(gasError, null, 2)
        });
        
        // More specific error checking
        const isCallException = errorInfo.code === 'CALL_EXCEPTION' || 
                               errorInfo.reason === 'missing revert data' ||
                               (gasError instanceof Error && gasError.message.includes('missing revert data'));
        
        if (isCallException) {
          // Let's try to call a simple view function to test the contract
          console.log('Testing contract with simple view function...');
          try {
            const totalNFTs = await contract.getTotalNFTs();
            console.log('Contract test successful, total NFTs:', totalNFTs.toString());
            throw new Error(`Contract exists and responds to view functions, but mintNFT gas estimation failed. This might be due to: 1) Insufficient permissions, 2) Invalid parameters, 3) Contract paused, or 4) Requires payment. Check contract implementation.`);
          } catch (viewError) {
            console.error('Contract view function test failed:', viewError);
            throw new Error(`Contract interaction completely failed. The NFT Factory contract at ${addresses.nftFactory} may not exist or may not have the expected interface. Error: ${gasError instanceof Error ? gasError.message : 'Unknown error'}`);
          }
        }
        
        throw new Error(`Gas estimation failed: ${gasError instanceof Error ? gasError.message : 'Unknown error'}. This usually means the contract call would fail.`);
      }

      // Prepare transaction options
      const txOptions: { gasLimit: bigint; value?: bigint } = {
        gasLimit: gasEstimate! * 120n / 100n, // Add 20% buffer (gasEstimate is defined by now)
      };

      // Add payment if required
      if (requiresPayment) {
        txOptions.value = paymentAmount;
        console.log(`💰 Adding payment of ${ethers.formatEther(paymentAmount)} BNB to transaction`);
      }

      const tx = await contract.mintNFT(
        recipientAddress,
        tokenURI,
        nftDetails.name,
        nftDetails.description,
        txOptions
      );

      console.log('NFT minting transaction sent:', tx.hash);
      const receipt = await tx.wait();

      return {
        success: true,
        hash: tx.hash,
        explorerUrl: this.getExplorerUrl(tx.hash),
        tokenId: receipt.logs[0]?.topics[3] // Token ID from logs
      };
    } catch (error) {
      console.error('NFT minting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'NFT minting failed'
      };
    }
  }

  // Send BNB or Tokens
  static async sendTransaction(
    transactionDetails: TransactionDetails,
    privateKey: string
  ): Promise<TransactionResult> {
    try {
      console.log('🚀 Starting transaction:', transactionDetails);
      
      const provider = this.getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);

      // Validate inputs
      if (!transactionDetails.recipient || !transactionDetails.amount) {
        throw new Error('Recipient and amount are required');
      }

      if (!ethers.isAddress(transactionDetails.recipient)) {
        throw new Error(`Invalid recipient address: ${transactionDetails.recipient}`);
      }

      const amount = transactionDetails.amount.toString();
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
      }

      // Check wallet balance
      const balance = await provider.getBalance(wallet.address);
      console.log('💰 Wallet balance:', ethers.formatEther(balance), 'BNB');

      let tx;
      
      if (transactionDetails.token === 'BNB' || !transactionDetails.token) {
        console.log('📤 Sending BNB transaction...');
        
        const valueToSend = ethers.parseEther(amount);
        const gasLimit = 21000n;
        const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('1', 'gwei');
        const gasCost = gasLimit * gasPrice;
        const totalCost = valueToSend + gasCost;
        
        console.log('💸 Transaction details:', {
          amount: ethers.formatEther(valueToSend) + ' BNB',
          gasCost: ethers.formatEther(gasCost) + ' BNB',
          totalCost: ethers.formatEther(totalCost) + ' BNB',
          walletBalance: ethers.formatEther(balance) + ' BNB'
        });

        if (balance < totalCost) {
          throw new Error(
            `Insufficient BNB balance. Need ${ethers.formatEther(totalCost)} BNB but only have ${ethers.formatEther(balance)} BNB. ` +
            `(Amount: ${ethers.formatEther(valueToSend)} + Gas: ${ethers.formatEther(gasCost)})`
          );
        }
        
        // Send BNB
        tx = await wallet.sendTransaction({
          to: transactionDetails.recipient,
          value: valueToSend,
          gasLimit: gasLimit
        });
        
        console.log('✅ BNB transaction sent:', tx.hash);
      } else {
        console.log('📤 Sending ERC-20 token transaction...');
        console.log('🪙 Token address:', transactionDetails.token);
        
        // Check if token address is valid
        if (!ethers.isAddress(transactionDetails.token)) {
          throw new Error(`Invalid token address: ${transactionDetails.token}`);
        }

        // Send ERC-20 Token
        const tokenContract = new ethers.Contract(transactionDetails.token, ERC20_ABI, wallet);
        
        try {
          // Get token info
          const [tokenName, tokenSymbol, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals()
          ]);
          
          console.log('🪙 Token info:', {
            name: tokenName,
            symbol: tokenSymbol,
            decimals: decimals.toString(),
            address: transactionDetails.token
          });
          
          // Check token balance
          const tokenBalance = await tokenContract.balanceOf(wallet.address);
          const amountToSend = ethers.parseUnits(amount, decimals);
          
          console.log('💰 Token balance:', ethers.formatUnits(tokenBalance, decimals), tokenSymbol);
          console.log('📤 Amount to send:', ethers.formatUnits(amountToSend, decimals), tokenSymbol);
          
          if (tokenBalance < amountToSend) {
            throw new Error(
              `Insufficient ${tokenSymbol} balance. Need ${ethers.formatUnits(amountToSend, decimals)} ${tokenSymbol} ` +
              `but only have ${ethers.formatUnits(tokenBalance, decimals)} ${tokenSymbol}.`
            );
          }
          
          // Check BNB balance for gas
          const estimatedGas = await tokenContract.transfer.estimateGas(transactionDetails.recipient, amountToSend);
          const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('1', 'gwei');
          const gasCost = estimatedGas * gasPrice;
          
          console.log('⛽ Gas estimate:', {
            gasLimit: estimatedGas.toString(),
            gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei',
            gasCost: ethers.formatEther(gasCost) + ' BNB'
          });
          
          if (balance < gasCost) {
            throw new Error(
              `Insufficient BNB for gas fees. Need ${ethers.formatEther(gasCost)} BNB for gas ` +
              `but only have ${ethers.formatEther(balance)} BNB.`
            );
          }
          
          tx = await tokenContract.transfer(transactionDetails.recipient, amountToSend, {
            gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
          });
          
          console.log('✅ Token transaction sent:', tx.hash);
        } catch (tokenError) {
          console.error('Token transaction failed:', tokenError);
          throw new Error(`Token transaction failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        }
      }

      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      return {
        success: true,
        hash: tx.hash,
        explorerUrl: this.getExplorerUrl(tx.hash)
      };
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  // Get transaction status
  static async getTransactionStatus(hash: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    blockNumber?: number;
    gasUsed?: string;
  }> {
    try {
      const provider = this.getProvider();
      const receipt = await provider.getTransactionReceipt(hash);
      
      if (!receipt) {
        return { status: 'pending' };
      }

      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return { status: 'failed' };
    }
  }

  // Estimate gas for operations with real BNB price
  static async estimateGas(operation: 'token' | 'nft' | 'transfer'): Promise<string> {
    try {
      const provider = this.getProvider();
      const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('1', 'gwei');

      let gasLimit = 21000n; // Default for simple transfers

      switch (operation) {
        case 'token':
          gasLimit = 500000n; // Token creation
          break;
        case 'nft':
          gasLimit = 200000n; // NFT minting
          break;
        case 'transfer':
          gasLimit = 21000n; // Simple transfer
          break;
      }

      const cost = gasLimit * gasPrice;
      return ethers.formatEther(cost);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return '0.0001'; // Realistic fallback estimate for opBNB (~$0.09 at $900/BNB)
    }
  }

  // Get gas cost in USD using real BNB price
  static async getGasCostUSD(operation: 'token' | 'nft' | 'transfer'): Promise<string> {
    try {
      const gasCostBNB = await this.estimateGas(operation);
      const priceData = await PriceService.getBNBPrice();
      const gasCostUSD = parseFloat(gasCostBNB) * priceData.price;
      
      return `$${gasCostUSD.toFixed(4)}`;
    } catch (error) {
      console.error('Failed to get gas cost in USD:', error);
      // Fallback costs at current price estimates
      const fallbackCosts = {
        token: '$0.27',
        nft: '$0.09', 
        transfer: '$0.009'
      };
      return fallbackCosts[operation];
    }
  }
}
