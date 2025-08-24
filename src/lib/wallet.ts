import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'fallback-key';

export interface WalletData {
  address: string;
  privateKey: string;
}

export class WalletService {
  // Generate a new opBNB wallet
  static generateWallet(): WalletData {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  // Encrypt private key before storing
  static encryptPrivateKey(privateKey: string): string {
    return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString();
  }

  // Decrypt private key after fetching
  static decryptPrivateKey(encryptedPrivateKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Create wallet instance from private key
  static createWalletFromPrivateKey(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey);
  }

  // Get opBNB provider (mainnet)
  static getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider('https://opbnb-mainnet-rpc.bnbchain.org');
  }

  // Get wallet with provider
  static getWalletWithProvider(privateKey: string): ethers.Wallet {
    const wallet = this.createWalletFromPrivateKey(privateKey);
    return wallet.connect(this.getProvider());
  }

  // Format address for display (0x1234...abcd)
  static formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Validate Ethereum address
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  // Get balance in BNB
  static async getBalance(address: string): Promise<string> {
    try {
      const provider = this.getProvider();
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }
}
