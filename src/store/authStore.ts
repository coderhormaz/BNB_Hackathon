import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Handle rehydration errors
        if (error) {
          console.log('Auth rehydration error:', error);
          // Reset to default state on error
          return {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          };
        }
        
        // After successful rehydration, we're initialized
        if (state) {
          state.isInitialized = true;
          state.isLoading = false;
        }
      },
    }
  )
);
