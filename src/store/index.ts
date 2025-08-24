import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserWallet } from '../lib/supabase';

interface WalletState {
  user: User | null;
  wallet: UserWallet | null;
  isLoading: boolean;
  balance: string;
  setUser: (user: User | null) => void;
  setWallet: (wallet: UserWallet | null) => void;
  setLoading: (loading: boolean) => void;
  setBalance: (balance: string) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  user: null,
  wallet: null,
  isLoading: false,
  balance: '0',
  setUser: (user) => set({ user }),
  setWallet: (wallet) => set({ wallet }),
  setLoading: (isLoading) => set({ isLoading }),
  setBalance: (balance) => set({ balance }),
  reset: () => set({ user: null, wallet: null, isLoading: false, balance: '0' })
}));

interface AuthModalState {
  isLoginOpen: boolean;
  isSignupOpen: boolean;
  openLogin: () => void;
  openSignup: () => void;
  closeModals: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isLoginOpen: false,
  isSignupOpen: false,
  openLogin: () => set({ isLoginOpen: true, isSignupOpen: false }),
  openSignup: () => set({ isSignupOpen: true, isLoginOpen: false }),
  closeModals: () => set({ isLoginOpen: false, isSignupOpen: false })
}));
