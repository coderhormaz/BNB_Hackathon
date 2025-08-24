import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWalletStore } from '../store';
import { useAuthStore } from '../store/authStore';
import { useWalletStore as useNewWalletStore } from '../store/walletStore';
import { AuthService } from '../services/auth';
import { WalletService } from '../lib/wallet';

export const useAuth = () => {
  const { setUser, setWallet, setLoading, setBalance, wallet } = useWalletStore();
  const { setUser: setAuthUser, setLoading: setAuthLoading, setInitialized, isInitialized } = useAuthStore();
  const { setWallet: setNewWallet } = useNewWalletStore();

  useEffect(() => {
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        console.log('Auth initialization timeout - forcing initialization');
        setInitialized(true);
        setLoading(false);
        setAuthLoading(false);
      }
    }, 5000); // 5 second timeout

    // Get initial session
    const initializeAuth = async () => {
      // Only run initialization if not already initialized from storage
      if (isInitialized) {
        setLoading(false);
        setAuthLoading(false);
        clearTimeout(timeout);
        return;
      }

      setLoading(true);
      setAuthLoading(true);
      
      try {
        const { user, wallet } = await AuthService.getCurrentSession();
        setUser(user);
        setAuthUser(user);
        setWallet(wallet);
        
        // Set wallet for dashboard components
        if (wallet) {
          setNewWallet({
            address: wallet.wallet_address,
            privateKey: wallet.encrypted_private_key // This would need decryption in real app
          });
          
          const balance = await WalletService.getBalance(wallet.wallet_address);
          setBalance(balance);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
        setAuthLoading(false);
        setInitialized(true);
        clearTimeout(timeout);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userWallet = await AuthService.getUserWallet(session.user.id);
        setUser(session.user);
        setAuthUser(session.user);
        setWallet(userWallet);
        
        if (userWallet) {
          setNewWallet({
            address: userWallet.wallet_address,
            privateKey: userWallet.encrypted_private_key // This would need decryption in real app
          });
          
          const balance = await WalletService.getBalance(userWallet.wallet_address);
          setBalance(balance);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthUser(null);
        setWallet(null);
        setNewWallet(null);
        setBalance('0');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [setUser, setAuthUser, setWallet, setNewWallet, setLoading, setAuthLoading, setBalance, setInitialized, isInitialized]);

  // Update balance periodically
  useEffect(() => {
    if (!wallet) return;

    const updateBalance = async () => {
      try {
        const balance = await WalletService.getBalance(wallet.wallet_address);
        setBalance(balance);
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    };

    // Update balance immediately
    updateBalance();

    // Update balance every 30 seconds
    const interval = setInterval(updateBalance, 30000);

    return () => clearInterval(interval);
  }, [wallet, setBalance]);
};
