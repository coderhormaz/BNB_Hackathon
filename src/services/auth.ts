import { supabase, testConnection } from '../lib/supabase';
import { WalletService } from '../lib/wallet';
import type { UserWallet } from '../lib/supabase';

export class AuthService {
  // Sign up new user and create wallet
  static async signUp(email: string, password: string, name: string) {
    try {
      console.log('📝 Attempting sign up for:', email, 'with name:', name);
      
      // Create user account with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (authError) {
        console.error('🚫 Sign up error:', authError);
        
        // Provide better error messages
        if (authError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (authError.message.includes('Password')) {
          throw new Error('Password must be at least 6 characters long.');
        } else if (authError.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error(authError.message || 'Account creation failed');
        }
      }

      if (authData.user) {
        console.log('✅ User created:', authData.user.email);
        
        // Generate new wallet
        const wallet = WalletService.generateWallet();
        console.log('🔑 Generated wallet for user:', wallet.address);
        
        // Encrypt private key
        const encryptedPrivateKey = WalletService.encryptPrivateKey(wallet.privateKey);

        // Store wallet in database
        const { error: walletError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: authData.user.id,
            wallet_address: wallet.address,
            encrypted_private_key: encryptedPrivateKey
          });

        if (walletError) {
          console.error('💸 Wallet creation error:', walletError);
          throw new Error('Account created but wallet setup failed. Please contact support.');
        }

        console.log('✅ Wallet stored in database');

        return { 
          user: authData.user, 
          wallet: {
            id: '',
            user_id: authData.user.id,
            wallet_address: wallet.address,
            encrypted_private_key: encryptedPrivateKey,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
      }

      throw new Error('Failed to create user account');
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  }

  // Sign in existing user and fetch wallet
  static async signIn(email: string, password: string) {
    try {
      console.log('🔐 Attempting sign in for:', email);
      
      // First, do a quick connection test
      try {
        console.log('⚡ Testing Supabase connection...');
        const healthCheck = await testConnection();
        
        if (!healthCheck.success) {
          console.error('💔 Connection test failed:', healthCheck.error);
          throw new Error(`Database connection failed: ${healthCheck.error}`);
        }
        
        console.log(`✅ Supabase connection test passed (${healthCheck.latency}ms)`);
        
        if (healthCheck.latency > 5000) {
          console.warn('⚠️ Slow connection detected, this may take longer than usual');
        }
      } catch (testError) {
        console.warn('⚠️ Connection test failed, continuing anyway:', testError);
      }
      
      // Create timeout promise with longer timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout - please check your network and try again')), 45000) // 45 seconds
      );

      // Sign in user with timeout
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      const authResult = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as Awaited<typeof authPromise>;
      
      const { data: authData, error: authError } = authResult;

      if (authError) {
        console.error('🚫 Authentication error:', authError);
        
        // Provide better error messages
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else if (authError.message.includes('Too many requests')) {
          throw new Error('Too many failed attempts. Please wait a few minutes before trying again.');
        } else {
          throw new Error(authError.message || 'Sign in failed');
        }
      }

      if (authData.user) {
        console.log('✅ User authenticated:', authData.user.email);
        
        // Fetch user's wallet with timeout
        const walletPromise = this.getUserWallet(authData.user.id);
        const walletTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Wallet fetch timeout')), 10000)
        );

        let wallet;
        try {
          wallet = await Promise.race([walletPromise, walletTimeoutPromise]);
        } catch (walletError) {
          console.warn('⚠️ Wallet fetch failed:', walletError);
          // Continue with login even if wallet fetch fails
          wallet = null;
        }
        
        if (!wallet) {
          console.warn('⚠️ No wallet found for user, this might be an old account');
          // You could create a wallet here if needed
        }
        
        return {
          user: authData.user,
          wallet
        };
      }

      throw new Error('Failed to sign in - no user data returned');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  }

  // Get user's wallet from database
  static async getUserWallet(userId: string): Promise<UserWallet | null> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No wallet found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        const wallet = await this.getUserWallet(session.user.id);
        return { user: session.user, wallet };
      }

      return { user: null, wallet: null };
    } catch (error) {
      console.error('Session error:', error);
      return { user: null, wallet: null };
    }
  }
}
