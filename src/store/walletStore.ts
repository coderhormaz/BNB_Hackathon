import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PriceService, type PriceData } from '../services/priceService';

export interface Wallet {
  address: string;
  privateKey: string;
}

interface WalletState {
  wallet: Wallet | null;
  isConnecting: boolean;
  balance: string;
  balanceUSD: string;
  bnbPrice: PriceData | null;
  isLoadingPrice: boolean;
  setWallet: (wallet: Wallet | null) => void;
  setConnecting: (connecting: boolean) => void;
  setBalance: (balance: string) => void;
  updateBNBPrice: () => Promise<void>;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      isConnecting: false,
      balance: '0',
      balanceUSD: '$0.00',
      bnbPrice: null,
      isLoadingPrice: false,
      setWallet: (wallet) => set({ wallet }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setBalance: async (balance) => {
        set({ balance });
        // Update USD value when balance changes
        const state = get();
        if (state.bnbPrice) {
          const balanceNum = parseFloat(balance) || 0;
          const usdValue = balanceNum * state.bnbPrice.price;
          set({ 
            balanceUSD: usdValue.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 6
            })
          });
        }
      },
      updateBNBPrice: async () => {
        try {
          set({ isLoadingPrice: true });
          const priceData = await PriceService.getBNBPrice();
          set({ bnbPrice: priceData, isLoadingPrice: false });
          
          // Update balance USD when price updates
          const state = get();
          if (state.balance) {
            const balanceNum = parseFloat(state.balance) || 0;
            const usdValue = balanceNum * priceData.price;
            set({ 
              balanceUSD: usdValue.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
              })
            });
          }
        } catch (error) {
          console.error('Failed to update BNB price:', error);
          set({ isLoadingPrice: false });
        }
      },
      clearWallet: () => set({ wallet: null, balance: '0', balanceUSD: '$0.00' }),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        wallet: state.wallet,
      }),
    }
  )
);
