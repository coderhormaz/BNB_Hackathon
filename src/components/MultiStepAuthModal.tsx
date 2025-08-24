import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthModalStore, useWalletStore } from '../store';
import { AuthService } from '../services/auth';
import type { UserWallet } from '../lib/supabase';

interface SignupStep1Data {
  name: string;
  email: string;
}

interface SignupStep2Data {
  password: string;
  confirmPassword: string;
}

export const MultiStepAuthModal: React.FC = () => {
  const { isLoginOpen, isSignupOpen, closeModals, openLogin, openSignup } = useAuthModalStore();
  const { setUser, setWallet, setLoading } = useWalletStore();
  
  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup step tracking
  const [signupStep, setSignupStep] = useState(1);
  const [signupStep1Data, setSignupStep1Data] = useState<SignupStep1Data>({
    name: '',
    email: ''
  });
  const [signupStep2Data, setSignupStep2Data] = useState<SignupStep2Data>({
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setLoginData({ email: '', password: '' });
    setSignupStep1Data({ name: '', email: '' });
    setSignupStep2Data({ password: '', confirmPassword: '' });
    setSignupStep(1);
    setError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    closeModals();
    resetForm();
  };

  // Login handlers
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    setLoading(true);

    try {
      console.log('🔐 Attempting login for:', loginData.email);
      
      // Add timeout to prevent infinite loading (increased timeout)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout - please try again')), 60000) // 60 seconds
      );

      const loginPromise = AuthService.signIn(loginData.email, loginData.password);

      const result = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as Awaited<typeof loginPromise>;
      
      const { user, wallet } = result;
      
      console.log('✅ Login successful:', user.email);
      setUser(user);
      setWallet(wallet as UserWallet | null);
      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in. Please check your credentials and try again.';
      console.error('❌ Login failed:', error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Signup Step 1 handlers
  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupStep1Data(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupStep1Data.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!signupStep1Data.email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupStep1Data.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSignupStep(2);
  };

  // Signup Step 2 handlers
  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupStep2Data(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (signupStep2Data.password !== signupStep2Data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupStep2Data.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setLoading(true);

    try {
      const { user, wallet } = await AuthService.signUp(
        signupStep1Data.email,
        signupStep2Data.password,
        signupStep1Data.name.trim()
      );
      setUser(user);
      setWallet(wallet as UserWallet | null);
      handleClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setSignupStep(1);
    setError('');
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 20 }
  };

  const isOpen = isLoginOpen || isSignupOpen;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={handleClose}>
              ×
            </button>

            {/* LOGIN MODAL */}
            {isLoginOpen && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Welcome Back</h2>
                  <p className="modal-subtitle">Sign in to access your opBNB wallet</p>
                </div>

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-input"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      className="form-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginBottom: 'var(--spacing-md)' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', marginBottom: 'var(--spacing-sm)' }}
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Signing in...</span>
                    ) : (
                      'Sign In'
                    )}
                  </button>

                  {isSubmitting && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsSubmitting(false);
                        setLoading(false);
                        setError('Sign in cancelled');
                      }}
                      style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                    >
                      Cancel
                    </button>
                  )}

                  {!isSubmitting && (
                    <div style={{ marginBottom: 'var(--spacing-md)' }} />
                  )}

                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={openSignup}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* SIGNUP MODAL - STEP 1 */}
            {isSignupOpen && signupStep === 1 && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Create Account</h2>
                  <p className="modal-subtitle">Let's start with your basic information</p>
                  <div className="progress-indicator">
                    <div className="progress-dot active"></div>
                    <div className="progress-dot inactive"></div>
                  </div>
                </div>

                <form onSubmit={handleStep1Submit}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={signupStep1Data.name}
                      onChange={handleStep1Change}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="Enter your email address"
                      value={signupStep1Data.email}
                      onChange={handleStep1Change}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      className="form-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginBottom: 'var(--spacing-md)' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                  >
                    Continue
                  </button>

                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={openLogin}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* SIGNUP MODAL - STEP 2 */}
            {isSignupOpen && signupStep === 2 && (
              <>
                <div className="modal-header">
                  <h2 className="modal-title">Secure Your Account</h2>
                  <p className="modal-subtitle">Create a strong password for {signupStep1Data.name}</p>
                  <div className="progress-indicator">
                    <div className="progress-dot inactive"></div>
                    <div className="progress-dot active"></div>
                  </div>
                </div>

                <form onSubmit={handleStep2Submit}>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-input"
                      placeholder="Create a strong password (min. 6 characters)"
                      value={signupStep2Data.password}
                      onChange={handleStep2Change}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-input"
                      placeholder="Confirm your password"
                      value={signupStep2Data.confirmPassword}
                      onChange={handleStep2Change}
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  {error && (
                    <motion.div
                      className="form-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginBottom: 'var(--spacing-md)' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-sm)', 
                    marginBottom: 'var(--spacing-md)' 
                  }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleBackToStep1}
                      style={{ flex: '0 0 auto' }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      style={{ flex: '1' }}
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">Creating Account...</span>
                      ) : (
                        'Create Account & Wallet'
                      )}
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={openLogin}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#667eea',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
