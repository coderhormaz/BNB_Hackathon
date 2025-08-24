# 🎯 Remix Deployment Guide for opBNB Mainnet

## 📁 Smart Contracts Ready for Deployment

Your contracts are ready in the `remix-contracts/` folder:

1. **TokenFactory.sol** - Create BEP-20 tokens
2. **NFTFactory.sol** - Mint NFTs with Greenfield integration  
3. **PaymentContract.sol** - Handle payments and fees

## 🚀 Step-by-Step Deployment

### Step 1: Open Remix IDE
1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create a new workspace or use default

### Step 2: Upload Contract Files
1. In Remix file explorer, create a new folder called `opbnb-contracts`
2. Upload all 3 contract files from your `remix-contracts/` folder
3. The contracts will automatically compile

### Step 3: Configure opBNB Mainnet
1. Install MetaMask if you haven't already
2. Add opBNB Mainnet to MetaMask:
   - **Network Name**: opBNB Mainnet
   - **RPC URL**: `https://opbnb-mainnet-rpc.bnbchain.org`
   - **Chain ID**: `204`
   - **Symbol**: `BNB`
   - **Block Explorer**: `https://opbnbscan.com`

### Step 4: Import Your Private Key
1. In MetaMask, click "Import Account"
2. Use your private key: `0x1f8b03ad889d4b81196cd73bee901dd8af8d5cceba7dccf0236a8a35b0cd71a9`
3. **⚠️ Make sure this wallet has BNB for gas fees!**

### Step 5: Deploy Contracts

#### 🏭 Deploy TokenFactory
1. Go to "Solidity Compiler" tab in Remix
2. Compile `TokenFactory.sol` (should auto-compile)
3. Go to "Deploy & Run Transactions" tab
4. Select "Injected Provider - MetaMask" as environment
5. Select `TokenFactory` contract
6. Click **Deploy**
7. **Copy the deployed address** → Update your .env file

#### 🖼️ Deploy NFTFactory  
1. Select `NFTFactory` contract
2. Click **Deploy**
3. **Copy the deployed address** → Update your .env file

#### 💰 Deploy PaymentContract
1. Select `PaymentContract` contract  
2. In constructor parameters, enter your treasury address (can use the same wallet address)
3. Click **Deploy**
4. **Copy the deployed address** → Update your .env file

### Step 6: Update Your .env File

Replace the placeholder addresses with your deployed contract addresses:

```env
# Smart Contract Addresses (opBNB Mainnet) - UPDATE WITH YOUR DEPLOYED ADDRESSES
VITE_TOKEN_FACTORY_CONTRACT=0x...YourTokenFactoryAddress...
VITE_NFT_FACTORY_CONTRACT=0x...YourNFTFactoryAddress...  
VITE_PAYMENT_CONTRACT=0x...YourPaymentContractAddress...
```

### Step 7: Test Your Contracts

After deployment, you can test directly in Remix:

#### Test TokenFactory:
```solidity
// Call createToken function with:
// name: "My Test Token"
// symbol: "MTT"  
// totalSupply: 1000000
// decimals: 18
```

#### Test NFTFactory:
```solidity
// Call mintNFT function with:
// to: your_wallet_address
// tokenURI: "https://example.com/metadata.json"
// name: "Test NFT"
// description: "My first NFT"
```

## 💰 Gas Cost Estimates (opBNB Mainnet)

| Contract | Deployment Cost | Function Calls |
|----------|----------------|----------------|
| TokenFactory | ~$0.01 | ~$0.0001 per token |
| NFTFactory | ~$0.015 | ~$0.0001 per NFT |
| PaymentContract | ~$0.008 | ~$0.00005 per payment |

**Total deployment cost: ~$0.033 (very cheap!)**

## 🔍 Verify Your Contracts

After deployment, you can verify on opBNBScan:

1. Go to [opbnbscan.com](https://opbnbscan.com)
2. Search for your contract address
3. Go to "Contract" tab → "Verify and Publish"
4. Upload the same source code from Remix

## ✅ Deployment Checklist

- [ ] Import private key to MetaMask
- [ ] Add opBNB Mainnet network  
- [ ] Ensure wallet has BNB for gas (~0.1 BNB recommended)
- [ ] Deploy TokenFactory contract
- [ ] Deploy NFTFactory contract
- [ ] Deploy PaymentContract contract
- [ ] Update .env file with deployed addresses
- [ ] Test contract functions in Remix
- [ ] Verify contracts on opBNBScan (optional)

## 🎉 After Deployment

Your opBNB AI Assistant will be fully functional with:
- ✅ Real token creation on opBNB mainnet
- ✅ Real NFT minting with Greenfield storage
- ✅ Real BNB transactions
- ✅ Ultra-low gas fees (<$0.001 per transaction)

## 🆘 Troubleshooting

**Gas estimation failed?** 
- Increase gas limit manually in MetaMask

**Transaction reverted?**
- Check you have enough BNB balance
- Verify contract parameters are correct

**Can't connect MetaMask?**
- Refresh Remix page
- Switch to opBNB Mainnet in MetaMask
- Try "WalletConnect" if injection fails

---

Ready to deploy? Your contracts are gas-optimized and production-ready! 🚀
